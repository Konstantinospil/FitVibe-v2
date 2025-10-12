import argon2 from 'argon2';
import crypto from 'crypto';
import { findUserById, updateUser, listUsers, changePassword, deactivateUser } from './users.repository.js';
import { UpdateProfileDTO, ChangePasswordDTO, UserSafe } from './users.types.js';
import { db } from '../../db/connection.js';
import { revokeRefreshByUserId } from '../auth/auth.repository.js';

export async function getMe(id: string): Promise<UserSafe | null> {
  const user = await findUserById(id);
  if (!user) return null;
  return { id: user.id, email: user.email, username: user.username, role: user.role, status: user.status, created_at: user.created_at, profile: user.profile };
}

export async function listAll(limit = 50, offset = 0) {
  return await listUsers(limit, offset);
}

async function insertAudit(user_id: string, action: string, meta?: any) {
  await db('audit_log').insert({
    id: crypto.randomUUID(),
    actor_user_id: user_id,
    action,
    entity: 'users',
    metadata: meta,
    created_at: new Date().toISOString()
  });
}

export async function updateProfile(id: string, dto: UpdateProfileDTO) {
  // Check username uniqueness only if changed
  if (dto.username) {
    const conflict = await db('users')
      .where({ username: dto.username })
      .whereNot({ id })                // exclude current user
      .first();

    if (conflict)
      throw Object.assign(new Error('Username already in use'), { status: 409 });
  }

  // Proceed with normal update
  await updateUser(id, {
    username: dto.username,
    profile: { locale: dto.locale, bio: dto.bio }
  });

  return getMe(id);
}

export async function updatePassword(id: string, dto: ChangePasswordDTO) {
  const user = await findUserById(id);
  if (!user) throw Object.assign(new Error('User not found'), { status: 404 });
  const ok = await argon2.verify(user.password_hash, dto.currentPassword);
  if (!ok) throw Object.assign(new Error('Invalid current password'), { status: 401 });
  const newHash = await argon2.hash(dto.newPassword);
  await changePassword(id, newHash);
  await insertAudit(id, 'change_password');
}

export async function deactivate(id: string) {
  await deactivateUser(id);
  await revokeRefreshByUserId(id);   // revoke all active sessions
  await insertAudit(id, 'deactivate_account');
}

export async function collectUserData(userId: string) {
  const [user] = await db('users').where({ id: userId });
  const sessions = await db('sessions').where({ user_id: userId });
  const plans = await db('plans').where({ user_id: userId });
  const logs = await db('exercise_sets').whereIn('session_id', sessions.map(s => s.id));
  const points = await db('points').where({ user_id: userId });
  const feed = await db('feed_posts').where({ author_id: userId });
  return { user, sessions, plans, logs, points, feed };
}
