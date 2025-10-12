import crypto from "crypto";
import jwt from "jsonwebtoken";
import argon2 from "argon2";
import { v4 as uuidv4 } from "uuid";
import db from "../../db/index.js";
import {
  findUserByEmail,
  insertRefreshToken,
  getRefreshByHash,
  revokeRefreshByHash,
  findUserById,
  createUser,
  deleteAuthTokensByType,
  createAuthToken,
  findAuthToken,
  consumeAuthToken,
  revokeRefreshByUserId,
  updateUserStatus,
  updateUserPassword,
} from "./auth.repository.js";
import { JwtPayload, LoginDTO, RegisterDTO, TokenPair, UserSafe } from "./auth.types.js";
import { env, RSA_KEYS } from "../../config/env.js";
import { HttpError } from "../../utils/httpError.js";

const ACCESS_TTL = env.ACCESS_TOKEN_TTL;
const REFRESH_TTL = env.REFRESH_TOKEN_TTL;
const EMAIL_VERIFICATION_TTL = env.EMAIL_VERIFICATION_TTL_SEC;
const PASSWORD_RESET_TTL = env.PASSWORD_RESET_TTL_SEC;

const TOKEN_TYPES = {
  EMAIL_VERIFICATION: "email_verification",
  PASSWORD_RESET: "password_reset",
} as const;

function signAccess(payload: Omit<JwtPayload, "iat" | "exp">) {
  return jwt.sign(payload, RSA_KEYS.privateKey, { algorithm: "RS256", expiresIn: ACCESS_TTL });
}

function signRefresh(payload: Omit<JwtPayload, "iat" | "exp" | "role">) {
  return jwt.sign(payload, RSA_KEYS.privateKey, { algorithm: "RS256", expiresIn: REFRESH_TTL });
}

function generateToken(): { raw: string; hash: string } {
  const raw = crypto.randomBytes(32).toString("base64url");
  const hash = crypto.createHash("sha256").update(raw).digest("hex");
  return { raw, hash };
}

async function issueAuthToken(userId: string, type: string, ttlSeconds: number) {
  await deleteAuthTokensByType(userId, type);
  const { raw, hash } = generateToken();
  const expires_at = new Date(Date.now() + ttlSeconds * 1000).toISOString();
  await createAuthToken({
    id: uuidv4(),
    user_id: userId,
    token_type: type,
    token_hash: hash,
    expires_at,
    created_at: new Date().toISOString(),
  });
  return raw;
}

function toSafeUser(record: any): UserSafe {
  return {
    id: record.id,
    email: record.email,
    username: record.username,
    role: record.role,
    status: record.status,
    created_at: record.created_at,
  };
}

function assertPasswordPolicy(password: string) {
  const complexity =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\w\s]).{12,}$/;
  if (!complexity.test(password)) {
    throw new HttpError(
      400,
      "AUTH_WEAK_PASSWORD",
      "Password must be at least 12 characters and include upper, lower, digit, and symbol",
    );
  }
}

export async function register(
  dto: RegisterDTO,
): Promise<{ verificationToken?: string; user?: UserSafe }> {
  assertPasswordPolicy(dto.password);
  const email = dto.email.toLowerCase();
  const existingByEmail = await findUserByEmail(email);
  const existingByUsername = await db("users").where({ username: dto.username }).first();

  if (existingByEmail || existingByUsername) {
    // If user exists but is pending verification, issue new token
    if (existingByEmail && existingByEmail.status === "pending_verification") {
      const token = await issueAuthToken(existingByEmail.id, TOKEN_TYPES.EMAIL_VERIFICATION, EMAIL_VERIFICATION_TTL);
      return { verificationToken: token, user: toSafeUser(existingByEmail) };
    }
    throw new HttpError(409, "AUTH_CONFLICT", "Unable to complete registration");
  }

  const id = uuidv4();
  const now = new Date().toISOString();
  const password_hash = await argon2.hash(dto.password);

  await createUser({
    id,
    email,
    username: dto.username,
    password_hash,
    role: "user",
    status: "pending_verification",
    created_at: now,
    updated_at: now,
  });

  await db("user_profiles").insert({
    user_id: id,
    display_name: dto.profile?.display_name ?? dto.username,
    sex: dto.profile?.sex ?? "na",
    weight_kg: dto.profile?.weight_kg ?? null,
    fitness_level: dto.profile?.fitness_level ?? null,
    age: dto.profile?.age ?? null,
    created_at: now,
    updated_at: now,
  });

  const verificationToken = await issueAuthToken(id, TOKEN_TYPES.EMAIL_VERIFICATION, EMAIL_VERIFICATION_TTL);
  const user = await findUserById(id);
  return { verificationToken, user: user ? toSafeUser(user) : undefined };
}

export async function verifyEmail(token: string): Promise<UserSafe> {
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  const record = await findAuthToken(TOKEN_TYPES.EMAIL_VERIFICATION, tokenHash);
  if (!record) {
    throw new HttpError(400, "AUTH_INVALID_TOKEN", "Invalid or expired verification token");
  }
  if (new Date(record.expires_at).getTime() <= Date.now()) {
    await consumeAuthToken(record.id);
    throw new HttpError(400, "AUTH_INVALID_TOKEN", "Invalid or expired verification token");
  }

  await consumeAuthToken(record.id);
  await updateUserStatus(record.user_id, "active");
  await deleteAuthTokensByType(record.user_id, TOKEN_TYPES.EMAIL_VERIFICATION);

  const user = await findUserById(record.user_id);
  if (!user) {
    throw new HttpError(404, "AUTH_USER_NOT_FOUND", "User not found");
  }
  return toSafeUser(user);
}

export async function login(
  dto: LoginDTO,
): Promise<{ user: UserSafe; tokens: TokenPair }> {
  const user = await findUserByEmail(dto.email.toLowerCase());
  if (!user || user.status !== "active") {
    throw new HttpError(401, "AUTH_INVALID_CREDENTIALS", "Invalid credentials");
  }
  const ok = await argon2.verify(user.password_hash, dto.password);
  if (!ok) {
    throw new HttpError(401, "AUTH_INVALID_CREDENTIALS", "Invalid credentials");
  }

  const refreshToken = signRefresh({ sub: user.id });
  const token_hash = crypto.createHash("sha256").update(refreshToken).digest("hex");
  const expires_at = new Date(Date.now() + REFRESH_TTL * 1000).toISOString();

  await insertRefreshToken({
    id: uuidv4(),
    user_id: user.id,
    token_hash,
    expires_at,
    created_at: new Date().toISOString(),
  });

  const tokens: TokenPair = {
    accessToken: signAccess({ sub: user.id, role: user.role }),
    refreshToken,
    accessExpiresIn: ACCESS_TTL,
  };

  return { user: toSafeUser(user), tokens };
}

export async function refresh(refreshToken: string): Promise<{ user: UserSafe; newRefresh: string; accessToken: string }> {
  try {
    const decoded = jwt.verify(refreshToken, RSA_KEYS.publicKey, { algorithms: ["RS256"] }) as JwtPayload;
    const token_hash = crypto.createHash("sha256").update(refreshToken).digest("hex");
    const rec = await getRefreshByHash(token_hash);
    if (!rec) throw new HttpError(401, "AUTH_INVALID_REFRESH", "Invalid refresh token");

    if (new Date(rec.expires_at).getTime() <= Date.now()) {
      await revokeRefreshByHash(token_hash);
      throw new HttpError(401, "AUTH_REFRESH_EXPIRED", "Refresh token expired");
    }

    const user = await findUserById(decoded.sub);
    if (!user || user.status !== "active") {
      throw new HttpError(401, "AUTH_USER_NOT_FOUND", "User not found");
    }

    await revokeRefreshByHash(token_hash);
    const newRefresh = signRefresh({ sub: user.id });
    const newHash = crypto.createHash("sha256").update(newRefresh).digest("hex");
    const expires_at = new Date(Date.now() + REFRESH_TTL * 1000).toISOString();
    await insertRefreshToken({
      id: uuidv4(),
      user_id: user.id,
      token_hash: newHash,
      expires_at,
      created_at: new Date().toISOString(),
    });

    return { user: toSafeUser(user), newRefresh, accessToken: signAccess({ sub: user.id, role: user.role }) };
  } catch (error) {
    if (error instanceof HttpError) {
      throw error;
    }
    throw new HttpError(401, "AUTH_INVALID_REFRESH", "Invalid refresh token");
  }
}

export async function logout(refreshToken: string | undefined): Promise<void> {
  if (!refreshToken) return;
  const token_hash = crypto.createHash("sha256").update(refreshToken).digest("hex");
  await revokeRefreshByHash(token_hash);
}

export async function requestPasswordReset(email: string): Promise<{ resetToken?: string }> {
  const normalized = email.toLowerCase();
  const user = await findUserByEmail(normalized);
  if (!user || user.status !== "active") {
    // Do not reveal existence
    return {};
  }

  const resetToken = await issueAuthToken(user.id, TOKEN_TYPES.PASSWORD_RESET, PASSWORD_RESET_TTL);
  return { resetToken };
}

export async function resetPassword(token: string, newPassword: string): Promise<void> {
  assertPasswordPolicy(newPassword);
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  const record = await findAuthToken(TOKEN_TYPES.PASSWORD_RESET, tokenHash);
  if (!record) {
    throw new HttpError(400, "AUTH_INVALID_TOKEN", "Invalid or expired reset token");
  }
  if (new Date(record.expires_at).getTime() <= Date.now()) {
    await consumeAuthToken(record.id);
    throw new HttpError(400, "AUTH_INVALID_TOKEN", "Invalid or expired reset token");
  }

  const password_hash = await argon2.hash(newPassword);
  await updateUserPassword(record.user_id, password_hash);
  await consumeAuthToken(record.id);
  await deleteAuthTokensByType(record.user_id, TOKEN_TYPES.PASSWORD_RESET);
  await revokeRefreshByUserId(record.user_id);
}
