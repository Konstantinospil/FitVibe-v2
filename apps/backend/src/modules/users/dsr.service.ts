import { db } from "../../db/connection.js";
import { insertAudit } from "../common/audit.util.js";
import { HttpError } from "../../utils/http.js";
import { deleteStorageObject } from "../../services/mediaStorage.service.js";
import { toError } from "../../utils/error.utils.js";
import { logger } from "../../config/logger.js";
import { env } from "../../config/env.js";

type UserRow = {
  id: string;
  username: string;
  status: string;
  deleted_at: string | null;
  purge_scheduled_at: string | null;
  backup_purge_due_at: string | null;
};

type MediaRow = { id: string; storage_key: string; owner_id: string };
type ContactRow = { value: string };

const { purgeDelayMinutes, backupPurgeDays } = env.dsr;

export interface DeleteSchedule {
  scheduledAt: string;
  purgeDueAt: string;
  backupPurgeDueAt: string;
}

function computeSchedule(now: Date, user: UserRow): DeleteSchedule {
  const scheduledAt = user.deleted_at ?? now.toISOString();
  const purgeDueAt =
    user.purge_scheduled_at ??
    new Date(now.getTime() + purgeDelayMinutes * 60 * 1000).toISOString();
  const backupPurgeDueAt =
    user.backup_purge_due_at ??
    new Date(now.getTime() + backupPurgeDays * 24 * 60 * 60 * 1000).toISOString();

  return { scheduledAt, purgeDueAt, backupPurgeDueAt };
}

export async function scheduleAccountDeletion(
  userId: string,
  now: Date = new Date(),
): Promise<DeleteSchedule> {
  const user = (await db<UserRow>("users").where({ id: userId }).first<UserRow>()) ?? null;
  if (!user) {
    throw new HttpError(404, "USER_NOT_FOUND", "User not found");
  }

  const schedule = computeSchedule(now, user);

  await db("users").where({ id: userId }).update({
    deleted_at: schedule.scheduledAt,
    purge_scheduled_at: schedule.purgeDueAt,
    backup_purge_due_at: schedule.backupPurgeDueAt,
    updated_at: new Date().toISOString(),
  });

  await insertAudit({
    actorUserId: userId,
    entity: "users",
    action: "delete_scheduled",
    entityId: userId,
    metadata: { ...schedule },
  });

  return schedule;
}

async function cleanupMedia(userId: string): Promise<MediaRow[]> {
  const mediaRows = await db<MediaRow>("media").where("owner_id", userId).select();
  await Promise.all(
    mediaRows.map(async (row) => {
      try {
        await deleteStorageObject(row.storage_key);
      } catch (error) {
        logger.warn(
          {
            err: toError(error),
            storageKey: row.storage_key,
          },
          "[dsr-purge] storage cleanup failed",
        );
      }
    }),
  );
  return mediaRows;
}

export async function executeAccountDeletion(userId: string): Promise<void> {
  const user = (await db<UserRow>("users").where({ id: userId }).first<UserRow>()) ?? null;
  if (!user) {
    throw new HttpError(404, "USER_NOT_FOUND", "User not found");
  }
  if (user.status !== "pending_deletion") {
    throw new HttpError(
      400,
      "USER_DELETE_INVALID_STATE",
      "Account must be pending deletion before purge",
    );
  }

  const mediaRows = await cleanupMedia(userId);
  const sessionIds = (await db("sessions")
    .where("owner_id", userId)
    .pluck<string>("id")) as string[];
  const primaryEmailRow = await db<ContactRow>("user_contacts")
    .where("user_id", userId)
    .andWhere("type", "email")
    .andWhere("is_primary", true)
    .first<ContactRow>();
  const purgedAt = new Date().toISOString();

  await db.transaction(async (trx) => {
    await trx("user_tombstones").insert({
      user_id: userId,
      username: user.username ?? null,
      email: primaryEmailRow?.value ?? null,
      deleted_at: user.deleted_at ?? purgedAt,
      purged_at: purgedAt,
      backup_purge_due_at: user.backup_purge_due_at ?? null,
      metadata: {
        mediaRemoved: mediaRows.length,
      },
    });

    if (sessionIds.length > 0) {
      await trx("exercise_sets")
        .whereIn("session_id", sessionIds as readonly string[])
        .del();
      await trx("session_exercises")
        .whereIn("session_id", sessionIds as readonly string[])
        .del();
    }

    await trx("sessions").where({ owner_id: userId }).del();
    await trx("exercises").where({ owner_id: userId }).del();
    await trx("plans").where({ user_id: userId }).del();
    await trx("user_metrics").where({ user_id: userId }).del();
    await trx("user_contacts").where({ user_id: userId }).del();
    await trx("user_static").where({ user_id: userId }).del();
    await trx("user_state_history").where({ user_id: userId }).del();
    await trx("user_points").where({ user_id: userId }).del();
    await trx("badges").where({ user_id: userId }).del();
    await trx("followers").where({ follower_id: userId }).del();
    await trx("followers").where({ following_id: userId }).del();
    await trx("media").where({ owner_id: userId }).del();
    await trx("auth_tokens").where({ user_id: userId }).del();
    await trx("refresh_tokens").where({ user_id: userId }).del();
    await trx("auth_sessions").where({ user_id: userId }).del();
    await trx("idempotency_keys").where({ user_id: userId }).del();
    await trx("audit_log").where({ actor_user_id: userId }).update({ actor_user_id: null });
    await trx("users").where({ id: userId }).del();
  });

  await insertAudit({
    actorUserId: null,
    entity: "users",
    action: "account_purged",
    entityId: userId,
    metadata: {
      purgedAt,
      mediaRemoved: mediaRows.length,
      backupPurgeDueAt: user.backup_purge_due_at ?? null,
    },
  });
}

export async function processDueAccountDeletions(now: Date = new Date()): Promise<number> {
  const dueUsers = await db<UserRow>("users")
    .where({ status: "pending_deletion" })
    .whereNotNull("purge_scheduled_at")
    .andWhere("purge_scheduled_at", "<=", now.toISOString())
    .select("id");

  for (const record of dueUsers) {
    await executeAccountDeletion(record.id);
  }

  return dueUsers.length;
}
