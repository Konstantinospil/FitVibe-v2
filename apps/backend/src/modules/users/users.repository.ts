import { db } from '../../db/connection.js';
import { UpdateProfileDTO } from './users.types.js';

export async function findUserByEmail(email: string) {
  return db('users').where({ email }).first();
}

export async function findUserById(id: string) {
  return db('users').where({ id }).first();
}

export async function updateUser(id: string, updates: UpdateProfileDTO) {
  const existing = await db('users').where({ id }).first();
  if (!existing) {
    throw Object.assign(new Error('User not found'), { status: 404 });
  }
  const mergedProfile = { ...(existing.profile || {}), ...(updates.profile || {}) };
  return db('users').where({ id }).update({
    ...updates,
    profile: mergedProfile,
    updated_at: new Date().toISOString()
  });
}

export async function listUsers(limit = 50, offset = 0) {
  return db('users').select('id', 'email', 'username', 'role', 'status', 'created_at').limit(limit).offset(offset);
}

export async function changePassword(id: string, password_hash: string) {
  return db('users').where({ id }).update({ password_hash, updated_at: new Date().toISOString() });
}

export async function deactivateUser(id: string) {
  return db('users').where({ id }).update({ status: 'archived', updated_at: new Date().toISOString() });
}
