import crypto from "crypto";
import { db } from "../../db/connection.js";

export interface AuditLogPayload {
  actorUserId?: string | null;
  entity: string;
  action: string;
  entityId?: string | null;
  metadata?: Record<string, unknown>;
}

export async function insertAudit({
  actorUserId = null,
  entity,
  action,
  entityId = null,
  metadata = {},
}: AuditLogPayload) {
  try {
    await db("audit_log").insert({
      id: crypto.randomUUID(),
      actor_user_id: actorUserId,
      entity,
      action,
      entity_id: entityId,
      metadata,
      created_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[AUDIT]", action, error);
  }
}
