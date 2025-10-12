import { db } from '../../db/connection';

export async function saveUserAvatarBase64(userId: string, base64: string) {
  return db('users')
    .where({ id: userId })
    .update({
      avatar_base64: base64,
      avatar_updated_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
}

export async function getUserAvatarBase64(userId: string): Promise<string | null> {
  const row = await db('users').select('avatar_base64').where({ id: userId }).first();
  return row?.avatar_base64 ?? null;
}

export async function clearUserAvatar(userId: string) {
  return db('users')
    .where({ id: userId })
    .update({
      avatar_base64: null,
      avatar_updated_at: null,
      updated_at: new Date().toISOString(),
    });
}
