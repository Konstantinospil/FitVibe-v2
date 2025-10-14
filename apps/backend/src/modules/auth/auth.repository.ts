import { db } from "../../db/connection.js";

export async function findUserByEmail(email: string) {
  return db("users").where({ email: email.toLowerCase() }).first();
}

export async function findUserByUsername(username: string) {
  return db("users")
    .whereRaw("LOWER(username) = ?", [username.toLowerCase()])
    .first();
}

export async function findUserById(id: string) {
  return db("users").where({ id }).first();
}

export async function createUser(row: any) {
  return db("users").insert(row).returning("*");
}

export async function updateUserStatus(userId: string, status: string) {
  return db("users")
    .where({ id: userId })
    .update({ status, updated_at: new Date().toISOString() });
}

export async function updateUserPassword(userId: string, passwordHash: string) {
  return db("users")
    .where({ id: userId })
    .update({ password_hash: passwordHash, updated_at: new Date().toISOString() });
}

export async function insertRefreshToken(row: any) {
  return db("refresh_tokens").insert(row).returning("*");
}

export async function revokeRefreshByHash(token_hash: string) {
  return db("refresh_tokens").where({ token_hash }).update({ revoked_at: new Date().toISOString() });
}

export async function getRefreshByHash(token_hash: string) {
  return db("refresh_tokens").where({ token_hash }).whereNull("revoked_at").first();
}

export async function revokeRefreshByUserId(user_id: string) {
  return db("refresh_tokens").where({ user_id }).update({ revoked_at: new Date().toISOString() });
}

export async function revokeRefreshBySession(session_jti: string) {
  return db("refresh_tokens").where({ session_jti }).update({ revoked_at: new Date().toISOString() });
}

export async function revokeRefreshByUserExceptSession(user_id: string, session_jti: string) {
  return db("refresh_tokens")
    .where({ user_id })
    .whereNot({ session_jti })
    .update({ revoked_at: new Date().toISOString() });
}

export async function findRefreshTokenRaw(token_hash: string) {
  return db("refresh_tokens").where({ token_hash }).first();
}

export async function createAuthToken(row: any) {
  return db("auth_tokens").insert(row).returning("*");
}

export async function deleteAuthTokensByType(userId: string, tokenType: string) {
  return db("auth_tokens").where({ user_id: userId, token_type: tokenType }).del();
}

export async function findAuthToken(tokenType: string, tokenHash: string) {
  return db("auth_tokens")
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

export async function createAuthSession(row: any) {
  return db("auth_sessions").insert(row).returning("*");
}

export async function findSessionById(jti: string) {
  return db("auth_sessions").where({ jti }).first();
}

export async function listSessionsByUserId(user_id: string) {
  return db("auth_sessions")
    .where({ user_id })
    .orderBy("created_at", "desc");
}

export async function updateSession(jti: string, patch: { expires_at?: string; user_agent?: string | null; ip?: string | null }) {
  return db("auth_sessions").where({ jti }).update(patch);
}

export async function revokeSessionById(jti: string) {
  return db("auth_sessions").where({ jti }).update({ revoked_at: new Date().toISOString() });
}

export async function revokeSessionsByUserId(user_id: string, excludeJti?: string) {
  const query = db("auth_sessions")
    .where({ user_id })
    .whereNull("revoked_at");
  if (excludeJti) {
    query.andWhereNot({ jti: excludeJti });
  }
  return query.update({ revoked_at: new Date().toISOString() });
}

export async function purgeExpiredSessions(olderThan: Date) {
  return db("auth_sessions").where("expires_at", "<", olderThan.toISOString()).del();
}
