import { db } from '../../db/connection';

export async function insertAudit(userId: string, action: string, payload: Record<string, any> = {}) {
  try {
    const id = (globalThis.crypto?.randomUUID?.() ?? require('crypto').randomUUID());
    await db('audit_log').insert({
      id,
      user_id: userId,
      action,
      payload: JSON.stringify(payload),
      created_at: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[AUDIT]', action, err);
  }
}
