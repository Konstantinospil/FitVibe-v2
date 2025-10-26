import crypto from "crypto";
import { db } from "../../db/connection.js";
import { logger } from "../../config/logger.js";

export interface AuditLogPayload {
  actorUserId?: string | null;
  entityType?: string;
  /**
   * @deprecated use entityType instead
   */
  entity?: string;
  action: string;
  entityId?: string | null;
  outcome?: string;
  requestId?: string | null;
  metadata?: Record<string, unknown>;
}

export async function insertAudit({
  actorUserId = null,
  entityType,
  entity,
  action,
  entityId = null,
  outcome = "success",
  requestId = null,
  metadata = {},
}: AuditLogPayload) {
  const resolvedEntityType = entityType ?? entity;
  if (!resolvedEntityType) {
    logger.warn({ action }, "[AUDIT] missing entityType");
    return;
  }

  try {
    await db("audit_log").insert({
      id: crypto.randomUUID(),
      actor_user_id: actorUserId,
      entity_type: resolvedEntityType,
      action,
      entity_id: entityId,
      outcome,
      request_id: requestId,
      metadata,
      created_at: new Date().toISOString(),
    });
  } catch (error) {
    logger.error({ err: error, action }, "[AUDIT] insert failed");
  }
}
