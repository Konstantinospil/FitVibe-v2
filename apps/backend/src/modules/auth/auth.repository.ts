import crypto from "crypto";
import type { Knex } from "knex";
import { db } from "../../db/connection.js";

const USERS_TABLE = "users";
const CONTACTS_TABLE = "user_contacts";

interface RefreshTokenInsert {
  id: string;
  user_id: string;
  token_hash: string;
  session_jti: string;
  expires_at: string;
  created_at: string;
  revoked_at?: string | null;
}

export interface RefreshTokenRecord extends RefreshTokenInsert {
  revoked_at: string | null;
}

interface AuthTokenInsert {
  id: string;
  user_id: string;
  token_type: string;
  token_hash: string;
  expires_at: string;
  created_at: string;
  consumed_at?: string | null;
}

export interface AuthTokenRecord extends AuthTokenInsert {
  consumed_at: string | null;
}

interface AuthSessionInsert {
  jti: string;
  user_id: string;
  user_agent: string | null;
  ip: string | null;
  created_at: string;
  expires_at: string;
  revoked_at?: string | null;
  last_active_at?: string | null;
}

export interface AuthSessionRecord extends AuthSessionInsert {
  revoked_at: string | null;
  last_active_at: string | null;
}

export interface AuthUserRecord {
  id: string;
  username: string;
  display_name: string;
  locale: string;
  preferred_lang: string;
  status: string;
  role_code: string;
  password_hash: string;
  created_at: string;
  updated_at: string;
  primary_email: string | null;
  email_verified: boolean;
}

function userQuery() {
  return db<AuthUserRecord>(`${USERS_TABLE} as u`)
    .leftJoin(`${CONTACTS_TABLE} as c`, function () {
      this.on("c.user_id", "=", "u.id")
        .andOn("c.type", "=", db.raw("?", ["email"]))
        .andOn("c.is_primary", "=", db.raw("true"));
    })
    .select(
      "u.id",
      "u.username",
      "u.display_name",
      "u.locale",
      "u.preferred_lang",
      "u.status",
      "u.role_code",
      "u.password_hash",
      "u.created_at",
      "u.updated_at",
      db.raw("c.value as primary_email"),
      db.raw("COALESCE(c.is_verified, false) as email_verified"),
    ) satisfies Knex.QueryBuilder<AuthUserRecord, AuthUserRecord[]>;
}

export async function findUserByEmail(email: string): Promise<AuthUserRecord | undefined> {
  const normalized = email.toLowerCase();
  return userQuery().whereRaw("LOWER(c.value) = ?", [normalized]).first<AuthUserRecord>();
}

export async function findUserByUsername(username: string): Promise<AuthUserRecord | undefined> {
  return userQuery()
    .whereRaw("LOWER(u.username) = ?", [username.toLowerCase()])
    .first<AuthUserRecord>();
}

export async function findUserById(id: string): Promise<AuthUserRecord | undefined> {
  return userQuery().where("u.id", id).first<AuthUserRecord>();
}

export async function createUser(input: {
  id: string;
  username: string;
  display_name: string;
  locale?: string;
  preferred_lang?: string;
  status: string;
  role_code: string;
  password_hash: string;
  primaryEmail: string;
  emailVerified?: boolean;
}): Promise<AuthUserRecord | undefined> {
  const now = new Date().toISOString();
  return db.transaction(async (trx) => {
    await trx(USERS_TABLE).insert({
      id: input.id,
      username: input.username,
      display_name: input.display_name,
      locale: input.locale ?? "en-US",
      preferred_lang: input.preferred_lang ?? "en",
      status: input.status,
      role_code: input.role_code,
      password_hash: input.password_hash,
      created_at: now,
      updated_at: now,
    });

    await trx(CONTACTS_TABLE).insert({
      id: crypto.randomUUID(),
      user_id: input.id,
      type: "email",
      value: input.primaryEmail.toLowerCase(),
      is_primary: true,
      is_recovery: true,
      is_verified: input.emailVerified ?? false,
      verified_at: input.emailVerified ? now : null,
      created_at: now,
    });

    return userQuery().transacting(trx).where("u.id", input.id).first<AuthUserRecord>();
  });
}

export async function updateUserStatus(userId: string, status: string) {
  return db("users").where({ id: userId }).update({ status, updated_at: new Date().toISOString() });
}

export async function updateUserPassword(userId: string, passwordHash: string) {
  return db("users").where({ id: userId }).update({
    password_hash: passwordHash,
    updated_at: new Date().toISOString(),
  });
}

export async function insertRefreshToken(row: RefreshTokenInsert): Promise<RefreshTokenRecord[]> {
  return db<RefreshTokenRecord>("refresh_tokens").insert(row).returning("*");
}

export async function revokeRefreshByHash(token_hash: string) {
  return db("refresh_tokens")
    .where({ token_hash })
    .update({ revoked_at: new Date().toISOString() });
}

export async function getRefreshByHash(
  token_hash: string,
): Promise<RefreshTokenRecord | undefined> {
  return db<RefreshTokenRecord>("refresh_tokens")
    .where({ token_hash })
    .whereNull("revoked_at")
    .first();
}

export async function revokeRefreshByUserId(user_id: string) {
  return db("refresh_tokens").where({ user_id }).update({ revoked_at: new Date().toISOString() });
}

export async function revokeRefreshBySession(session_jti: string) {
  return db("refresh_tokens")
    .where({ session_jti })
    .update({ revoked_at: new Date().toISOString() });
}

export async function revokeRefreshByUserExceptSession(user_id: string, session_jti: string) {
  return db("refresh_tokens")
    .where({ user_id })
    .whereNot({ session_jti })
    .update({ revoked_at: new Date().toISOString() });
}

export async function findRefreshTokenRaw(
  token_hash: string,
): Promise<RefreshTokenRecord | undefined> {
  return db<RefreshTokenRecord>("refresh_tokens").where({ token_hash }).first();
}

export async function createAuthToken(row: AuthTokenInsert): Promise<AuthTokenRecord[]> {
  return db<AuthTokenRecord>("auth_tokens").insert(row).returning("*");
}

export async function deleteAuthTokensByType(userId: string, tokenType: string) {
  return db("auth_tokens").where({ user_id: userId, token_type: tokenType }).del();
}

export async function findAuthToken(
  tokenType: string,
  tokenHash: string,
): Promise<AuthTokenRecord | undefined> {
  return db<AuthTokenRecord>("auth_tokens")
    .where({ token_type: tokenType, token_hash: tokenHash })
    .whereNull("consumed_at")
    .first();
}

export async function consumeAuthToken(id: string) {
  return db("auth_tokens").where({ id }).update({ consumed_at: new Date().toISOString() });
}

export async function markAuthTokensConsumed(userId: string, tokenType: string) {
  return db("auth_tokens")
    .where({ user_id: userId, token_type: tokenType })
    .whereNull("consumed_at")
    .update({ consumed_at: new Date().toISOString() });
}

export async function countAuthTokensSince(userId: string, tokenType: string, since: Date) {
  const result = await db("auth_tokens")
    .where({ user_id: userId, token_type: tokenType })
    .where("created_at", ">=", since.toISOString())
    .count<{ count: string }>("id as count")
    .first();
  return Number(result?.count ?? 0);
}

export async function purgeAuthTokensOlderThan(tokenType: string, olderThan: Date) {
  return db("auth_tokens")
    .where({ token_type: tokenType })
    .andWhere("created_at", "<", olderThan.toISOString())
    .del();
}

export async function createAuthSession(row: AuthSessionInsert): Promise<AuthSessionRecord[]> {
  return db<AuthSessionRecord>("auth_sessions").insert(row).returning("*");
}

export async function findSessionById(jti: string): Promise<AuthSessionRecord | undefined> {
  return db<AuthSessionRecord>("auth_sessions").where({ jti }).first();
}

export async function listSessionsByUserId(user_id: string): Promise<AuthSessionRecord[]> {
  return db<AuthSessionRecord>("auth_sessions").where({ user_id }).orderBy("created_at", "desc");
}

export async function updateSession(
  jti: string,
  patch: {
    expires_at?: string;
    user_agent?: string | null;
    ip?: string | null;
  },
) {
  return db("auth_sessions").where({ jti }).update(patch);
}

export async function revokeSessionById(jti: string) {
  return db("auth_sessions").where({ jti }).update({ revoked_at: new Date().toISOString() });
}

export async function revokeSessionsByUserId(user_id: string, excludeJti?: string) {
  const query = db("auth_sessions").where({ user_id }).whereNull("revoked_at");
  if (excludeJti) {
    query.andWhereNot({ jti: excludeJti });
  }
  return query.update({ revoked_at: new Date().toISOString() });
}

export async function purgeExpiredSessions(olderThan: Date) {
  return db("auth_sessions").where("expires_at", "<", olderThan.toISOString()).del();
}

export async function markEmailVerified(userId: string, email: string) {
  const now = new Date().toISOString();
  return db(CONTACTS_TABLE)
    .where({ user_id: userId, type: "email" })
    .whereRaw("LOWER(value) = ?", [email.toLowerCase()])
    .update({
      is_verified: true,
      verified_at: now,
    });
}
