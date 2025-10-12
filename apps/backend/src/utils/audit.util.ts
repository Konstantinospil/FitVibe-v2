import { db } from '../db/connection.js';
import crypto from 'crypto';

export async function insertAudit(
  userId: string,
  action: string,
  payload: Record<string, any> = {}
) {
  try {
    await db('audit_log').insert({
      id: crypto.randomUUID(),
      user_id: userId,
      action,
      payload: JSON.stringify(payload),
      created_at: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[AUDIT]', action, err);
  }
}
