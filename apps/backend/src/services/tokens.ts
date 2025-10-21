import jwt from "jsonwebtoken";

import { env, RSA_KEYS } from "../config/env.js";
import { newJti } from "../utils/hash.js";
import type { JwtPayload, RefreshTokenPayload, TokenPair } from "../modules/auth/auth.types";

type AccessTokenClaims = Pick<JwtPayload, "sub" | "role"> & {
  username: string;
  sid?: string;
};

export function signAccessToken(claims: AccessTokenClaims): string {
  return jwt.sign(claims, RSA_KEYS.privateKey, {
    algorithm: "RS256",
    expiresIn: env.ACCESS_TOKEN_TTL,
  });
}

export function signRefreshToken(sub: string, jti: string): string {
  return jwt.sign({ sub, jti, typ: "refresh" }, RSA_KEYS.privateKey, {
    algorithm: "RS256",
    expiresIn: env.REFRESH_TOKEN_TTL,
  });
}

export function verifyAccess(token: string): JwtPayload {
  const decoded = jwt.verify(token, RSA_KEYS.publicKey, {
    algorithms: ["RS256"],
  });
  return typeof decoded === "string"
    ? (JSON.parse(decoded) as JwtPayload)
    : (decoded as JwtPayload);
}

export function verifyRefresh(token: string): RefreshTokenPayload {
  const decoded = jwt.verify(token, RSA_KEYS.publicKey, {
    algorithms: ["RS256"],
  });
  if (typeof decoded === "string") {
    return JSON.parse(decoded) as RefreshTokenPayload;
  }
  return decoded as RefreshTokenPayload;
}

export function issueTokenPair(user: {
  id: string;
  username: string;
}): TokenPair & { jti: string } {
  const jti = newJti();
  const access = signAccessToken({
    sub: user.id,
    username: user.username,
    role: "user",
    sid: jti,
  });
  const refresh = signRefreshToken(user.id, jti);
  return {
    accessToken: access,
    refreshToken: refresh,
    accessExpiresIn: env.ACCESS_TOKEN_TTL,
    jti,
  };
}
