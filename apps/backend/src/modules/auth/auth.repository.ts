import { db } from '../../db/connection.js';

export async function findUserByEmail(email: string) {
  return db('users').where({ email: email.toLowerCase() }).first();
}

export async function findUserByUsername(username: string) {
  return db('users').where({ username }).first();
}

export async function findUserById(id: string) {
  return db('users').where({ id }).first();
}

export async function createUser(row: any) {
  return db('users').insert(row).returning('*');
}

export async function updateUserStatus(userId: string, status: string) {
  return db('users').where({ id: userId }).update({ status, updated_at: new Date().toISOString() });
}

export async function updateUserPassword(userId: string, passwordHash: string) {
  return db('users').where({ id: userId }).update({ password_hash: passwordHash, updated_at: new Date().toISOString() });
}

export async function insertRefreshToken(row: any) {
  return db('refresh_tokens').insert(row).returning('*');
}

export async function revokeRefreshByHash(token_hash: string) {
  return db('refresh_tokens').where({ token_hash }).update({ revoked_at: new Date().toISOString() });
}

export async function getRefreshByHash(token_hash: string) {
  return db('refresh_tokens').where({ token_hash }).whereNull('revoked_at').first();
}

export async function revokeRefreshByUserId(user_id: string) {
  return db('refresh_tokens').where({ user_id }).update({ revoked_at: new Date().toISOString() });
}

export async function createAuthToken(row: any) {
  return db('auth_tokens').insert(row).returning('*');
}

export async function deleteAuthTokensByType(userId: string, tokenType: string) {
  return db('auth_tokens').where({ user_id: userId, token_type: tokenType }).del();
}

export async function findAuthToken(tokenType: string, tokenHash: string) {
  return db('auth_tokens')
    .where({ token_type: tokenType, token_hash: tokenHash })
    .whereNull('consumed_at')
    .first();
}

export async function consumeAuthToken(id: string) {
  return db('auth_tokens').where({ id }).update({ consumed_at: new Date().toISOString() });
}
