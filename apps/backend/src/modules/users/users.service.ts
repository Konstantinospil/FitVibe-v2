import crypto from "crypto";
import bcrypt from "bcryptjs";
import { db } from "../../db/connection.js";
import type { ContactRow, UserRow, AvatarRow } from "./users.repository.js";
import {
  findUserById,
  listUsers as listUserRows,
  changePassword,
  updateUserProfile,
  createUserRecord,
  setUserStatus,
  fetchUserWithContacts,
  insertStateHistory,
  getUserContacts,
  upsertContact,
  markContactVerified,
  deleteContact,
  getContactById,
} from "./users.repository.js";
import type {
  UpdateProfileDTO,
  ChangePasswordDTO,
  CreateUserDTO,
  UserSafe,
  UserDetail,
  UserStatus,
  UserContact,
  UserAvatar,
} from "./users.types.js";
import {
  revokeRefreshByUserId,
  createAuthToken,
  findAuthToken,
  consumeAuthToken,
  markAuthTokensConsumed,
  countAuthTokensSince,
  purgeAuthTokensOlderThan,
} from "../auth/auth.repository.js";
import { assertPasswordPolicy } from "../auth/passwordPolicy.js";
import { env } from "../../config/env.js";
import { HttpError } from "../../utils/http.js";
import { insertAudit } from "../common/audit.util.js";
import { logger } from "../../config/logger.js";
import { deleteStorageObject } from "../../services/mediaStorage.service.js";
import { toError } from "../../utils/error.utils.js";

const USERNAME_REGEX = /^[a-zA-Z0-9_.-]{3,50}$/;
const STATUS_TRANSITIONS: Record<UserStatus, UserStatus[]> = {
  pending_verification: ["active", "archived", "pending_deletion"],
  active: ["archived", "pending_deletion"],
  archived: ["active", "pending_deletion"],
  pending_deletion: [],
};
const INITIAL_ALLOWED_STATUSES: UserStatus[] = ["pending_verification", "active", "archived"];
const CONTACT_VERIFICATION_TOKEN_PREFIX = "contact_verify";
const CONTACT_VERIFICATION_TTL_SEC = env.EMAIL_VERIFICATION_TTL_SEC;
const CONTACT_VERIFICATION_RESEND_LIMIT = 3;
const CONTACT_VERIFICATION_RESEND_WINDOW_MS = 60 * 60 * 1000;
const CONTACT_VERIFICATION_RETENTION_DAYS = 7;

function toContact(row: ContactRow): UserContact {
  return {
    id: row.id,
    type: row.type,
    value: row.value,
    isPrimary: row.is_primary,
    isRecovery: row.is_recovery,
    isVerified: row.is_verified,
    verifiedAt: row.verified_at,
    createdAt: row.created_at,
  };
}

function primaryEmail(contacts: ContactRow[]): string | null {
  return contacts.find((contact) => contact.type === "email" && contact.is_primary)?.value ?? null;
}

function primaryPhone(contacts: ContactRow[]): string | null {
  return contacts.find((contact) => contact.type === "phone")?.value ?? null;
}

function toUserDetail(
  user: UserRow,
  contacts: ContactRow[],
  avatar?: AvatarRow | null,
): UserDetail {
  return {
    id: user.id,
    username: user.username,
    displayName: user.display_name,
    locale: user.locale,
    preferredLang: user.preferred_lang,
    role: user.role_code,
    status: user.status as UserStatus,
    createdAt: user.created_at,
    updatedAt: user.updated_at,
    primaryEmail: primaryEmail(contacts),
    phoneNumber: primaryPhone(contacts),
    avatar: toUserAvatar(avatar),
    contacts: contacts.map(toContact),
  };
}

function toUserSafe(row: UserRow): UserSafe {
  return {
    id: row.id,
    username: row.username,
    displayName: row.display_name,
    locale: row.locale,
    preferredLang: row.preferred_lang,
    role: row.role_code,
    status: row.status as UserStatus,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    primaryEmail: row.primary_email ?? null,
    phoneNumber: null,
    avatar: toUserAvatarFromList(row),
  };
}

async function ensureUsernameAvailable(userId: string, username: string) {
  const normalized = username.toLowerCase();
  const conflict = await db<UserRow>("users")
    .whereRaw("LOWER(username) = ?", [normalized])
    .whereNot({ id: userId })
    .first<UserRow>();
  if (conflict) {
    throw new HttpError(409, "USER_USERNAME_TAKEN", "Username already in use");
  }
}

function ensureUsernameFormat(username: string) {
  if (!USERNAME_REGEX.test(username)) {
    throw new HttpError(
      422,
      "USER_USERNAME_INVALID",
      "Username must be 3-50 characters and may include letters, numbers, dot, underscore, and dash",
    );
  }
}

function assertStatusTransition(current: string, next: UserStatus) {
  const allowed = STATUS_TRANSITIONS[current as UserStatus] ?? [];
  if (!allowed.includes(next)) {
    throw new HttpError(
      400,
      "USER_STATUS_INVALID",
      `Cannot transition status from ${current} to ${next}`,
    );
  }
}

function isUniqueViolation(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }
  const maybeCode = (error as { code?: unknown }).code;
  return typeof maybeCode === "string" && maybeCode === "23505";
}

function toUserAvatar(row: AvatarRow | null | undefined): UserAvatar | null {
  if (!row) {
    return null;
  }
  return {
    url: row.file_url,
    mimeType: row.mime_type ?? null,
    bytes: row.bytes ?? null,
    updatedAt: row.created_at ?? null,
  };
}

function toUserAvatarFromList(row: {
  avatar_url?: string | null;
  avatar_mime_type?: string | null;
  avatar_bytes?: number | string | null;
  avatar_updated_at?: string | null;
}): UserAvatar | null {
  if (!row?.avatar_url) {
    return null;
  }
  const bytes =
    row.avatar_bytes === undefined || row.avatar_bytes === null ? null : Number(row.avatar_bytes);
  return {
    url: row.avatar_url,
    mimeType: row.avatar_mime_type ?? null,
    bytes,
    updatedAt: row.avatar_updated_at ?? null,
  };
}

function contactTokenType(contactId: string): string {
  return `${CONTACT_VERIFICATION_TOKEN_PREFIX}:${contactId}`;
}

function generateContactToken() {
  const raw = crypto.randomBytes(32).toString("base64url");
  const hash = crypto.createHash("sha256").update(raw).digest("hex");
  return { raw, hash };
}

export async function createUser(
  actorUserId: string | null,
  dto: CreateUserDTO,
): Promise<UserDetail> {
  const userId = crypto.randomUUID();
  const username = dto.username.trim();
  const displayName = dto.displayName.trim();
  const email = dto.email.trim().toLowerCase();
  const roleCode = dto.role.trim();
  const initialStatus: UserStatus = dto.status ?? "pending_verification";

  ensureUsernameFormat(username);
  if (!displayName) {
    throw new HttpError(422, "USER_DISPLAY_NAME_REQUIRED", "Display name is required");
  }
  if (!email) {
    throw new HttpError(422, "USER_EMAIL_INVALID", "Email is required");
  }
  if (!roleCode) {
    throw new HttpError(422, "USER_ROLE_INVALID", "Role is required");
  }
  if (!INITIAL_ALLOWED_STATUSES.includes(initialStatus)) {
    throw new HttpError(400, "USER_STATUS_INVALID", "Invalid initial status");
  }

  await ensureUsernameAvailable(userId, username);
  assertPasswordPolicy(dto.password, { email, username });
  const passwordHash = await bcrypt.hash(dto.password, 12);
  const locale = dto.locale?.trim() || undefined;
  const preferredLang = dto.preferredLang?.trim() || undefined;

  try {
    await db.transaction(async (trx) => {
      await createUserRecord(
        {
          id: userId,
          username,
          displayName,
          locale,
          preferredLang,
          status: initialStatus,
          roleCode,
          passwordHash,
        },
        trx,
      );
      try {
        await upsertContact(
          userId,
          { type: "email", value: email, isPrimary: true, isRecovery: true },
          trx,
        );
      } catch (contactError) {
        if (isUniqueViolation(contactError)) {
          throw new HttpError(409, "USER_EMAIL_TAKEN", "Email already in use");
        }
        throw contactError;
      }
      await insertStateHistory(userId, "status", null, initialStatus, trx);
    });
  } catch (error) {
    if (error instanceof HttpError) {
      throw error;
    }
    if (isUniqueViolation(error)) {
      throw new HttpError(409, "USER_USERNAME_TAKEN", "Username already in use");
    }
    throw error;
  }

  await insertAudit({
    actorUserId,
    entity: "users",
    action: "create",
    entityId: userId,
    metadata: {
      status: initialStatus,
      role: roleCode,
    },
  });

  const created = await fetchUserWithContacts(userId);
  if (!created) {
    throw new HttpError(500, "USER_REFRESH_FAILED", "Unable to load created user");
  }
  return toUserDetail(created.user, created.contacts, created.avatar);
}

export async function getMe(id: string): Promise<UserDetail | null> {
  const full = await fetchUserWithContacts(id);
  if (!full) {
    return null;
  }
  return toUserDetail(full.user, full.contacts, full.avatar);
}

export async function listAll(limit = 50, offset = 0): Promise<UserSafe[]> {
  const rows = await listUserRows(limit, offset);
  return rows.map(toUserSafe);
}

export async function updateProfile(userId: string, dto: UpdateProfileDTO): Promise<UserDetail> {
  const user = await findUserById(userId);
  if (!user) {
    throw new HttpError(404, "USER_NOT_FOUND", "User not found");
  }

  const patch: UpdateProfileDTO = {};
  const changes: Record<string, { old: unknown; next: unknown }> = {};

  if (dto.username) {
    const normalized = dto.username.trim();
    ensureUsernameFormat(normalized);
    if (normalized.toLowerCase() !== user.username.toLowerCase()) {
      await ensureUsernameAvailable(userId, normalized);
      patch.username = normalized;
      changes.username = { old: user.username, next: normalized };
    }
  }

  if (dto.displayName && dto.displayName !== user.display_name) {
    patch.displayName = dto.displayName;
    changes.display_name = { old: user.display_name, next: dto.displayName };
  }

  if (dto.locale && dto.locale !== user.locale) {
    patch.locale = dto.locale;
    changes.locale = { old: user.locale, next: dto.locale };
  }

  if (dto.preferredLang && dto.preferredLang !== user.preferred_lang) {
    patch.preferredLang = dto.preferredLang;
    changes.preferred_lang = {
      old: user.preferred_lang,
      next: dto.preferredLang,
    };
  }

  await db.transaction(async (trx) => {
    if (Object.keys(patch).length > 0) {
      await updateUserProfile(userId, patch, trx);
      for (const [field, diff] of Object.entries(changes)) {
        await insertStateHistory(userId, field, diff.old, diff.next, trx);
      }
    }
  });

  if (Object.keys(changes).length > 0) {
    await insertAudit({
      actorUserId: userId,
      entity: "users",
      action: "profile_update",
      entityId: userId,
      metadata: { changes },
    });
  }

  const updated = await fetchUserWithContacts(userId);
  if (!updated) {
    throw new HttpError(500, "USER_REFRESH_FAILED", "Unable to load updated profile");
  }
  return toUserDetail(updated.user, updated.contacts, updated.avatar);
}

export async function updatePassword(userId: string, dto: ChangePasswordDTO): Promise<void> {
  const user = await findUserById(userId);
  if (!user) {
    throw new HttpError(404, "USER_NOT_FOUND", "User not found");
  }

  const ok = await bcrypt.compare(dto.currentPassword, user.password_hash);
  if (!ok) {
    throw new HttpError(401, "USER_INVALID_PASSWORD", "Invalid current password");
  }

  const contacts = await getUserContacts(userId);
  const email = primaryEmail(contacts) ?? undefined;

  assertPasswordPolicy(dto.newPassword, { email, username: user.username });
  const newHash = await bcrypt.hash(dto.newPassword, 12);
  await changePassword(userId, newHash);
  await revokeRefreshByUserId(userId);
  await insertAudit({
    actorUserId: userId,
    entity: "users",
    action: "password_change",
    entityId: userId,
    metadata: { rotatedSessions: true },
  });
}

export async function changeStatus(
  actorUserId: string | null,
  userId: string,
  nextStatus: UserStatus,
): Promise<UserDetail> {
  const user = await findUserById(userId);
  if (!user) {
    throw new HttpError(404, "USER_NOT_FOUND", "User not found");
  }
  if (user.status === nextStatus) {
    const full = await fetchUserWithContacts(userId);
    if (!full) {
      throw new HttpError(500, "USER_REFRESH_FAILED", "Unable to load user state");
    }
    return toUserDetail(full.user, full.contacts, full.avatar);
  }
  assertStatusTransition(user.status, nextStatus);

  await db.transaction(async (trx) => {
    await setUserStatus(userId, nextStatus, trx);
    await insertStateHistory(userId, "status", user.status, nextStatus, trx);
  });

  await insertAudit({
    actorUserId,
    entity: "users",
    action: "status_change",
    entityId: userId,
    metadata: { from: user.status, to: nextStatus },
  });

  if (nextStatus !== "active") {
    await revokeRefreshByUserId(userId);
  }

  const refreshed = await fetchUserWithContacts(userId);
  if (!refreshed) {
    throw new HttpError(500, "USER_REFRESH_FAILED", "Unable to load user state");
  }
  return toUserDetail(refreshed.user, refreshed.contacts, refreshed.avatar);
}

async function purgeUserAccount(userId: string): Promise<void> {
  type MediaRow = { id: string; storage_key: string; owner_id: string };
  const mediaItems = await db<MediaRow>("media").where({
    owner_id: userId,
  });
  await Promise.all(
    mediaItems.map(async (item) => {
      try {
        await deleteStorageObject(item.storage_key);
      } catch (error) {
        logger.warn(
          {
            err: toError(error),
            storageKey: item.storage_key,
          },
          "[user-purge] storage cleanup failed",
        );
      }
    }),
  );

  await db.transaction(async (trx) => {
    if (mediaItems.length) {
      await trx("media").where({ owner_id: userId }).del();
    }
    await trx("users").where({ id: userId }).del();
  });

  await insertAudit({
    actorUserId: null,
    entity: "users",
    action: "account_purged",
    entityId: userId,
    metadata: { mediaRemoved: mediaItems.length },
  });
}

export async function requestAccountDeletion(userId: string): Promise<{ scheduledAt: string }> {
  const user = await findUserById(userId);
  if (!user) {
    throw new HttpError(404, "USER_NOT_FOUND", "User not found");
  }

  const scheduledAt = new Date().toISOString();

  if (user.status !== "pending_deletion") {
    await changeStatus(userId, userId, "pending_deletion");
    await db("users").where({ id: userId }).update({ deleted_at: scheduledAt });
    await insertAudit({
      actorUserId: userId,
      entity: "users",
      action: "delete_request",
      entityId: userId,
      metadata: { scheduledAt },
    });
  }

  await purgeUserAccount(userId);
  return { scheduledAt };
}

export async function listContacts(userId: string): Promise<UserContact[]> {
  const contacts = await getUserContacts(userId);
  return contacts.map(toContact);
}

export async function requestContactVerification(
  userId: string,
  contactId: string,
): Promise<{ token: string; expiresAt: string }> {
  const contact = await getContactById(contactId);
  if (!contact || contact.user_id !== userId) {
    throw new HttpError(404, "USER_CONTACT_NOT_FOUND", "Contact not found");
  }
  if (contact.is_verified) {
    throw new HttpError(409, "USER_CONTACT_ALREADY_VERIFIED", "Contact already verified");
  }

  const now = Date.now();
  const tokenType = contactTokenType(contactId);
  const windowStart = new Date(now - CONTACT_VERIFICATION_RESEND_WINDOW_MS);
  const recentAttempts = await countAuthTokensSince(userId, tokenType, windowStart);
  if (recentAttempts >= CONTACT_VERIFICATION_RESEND_LIMIT) {
    throw new HttpError(
      429,
      "USER_CONTACT_VERIFY_LIMIT",
      "Verification request limit reached. Try again later.",
    );
  }

  const retentionCutoff = new Date(now - CONTACT_VERIFICATION_RETENTION_DAYS * 24 * 60 * 60 * 1000);
  await purgeAuthTokensOlderThan(tokenType, retentionCutoff);
  await markAuthTokensConsumed(userId, tokenType);

  const { raw, hash } = generateContactToken();
  const createdAt = new Date(now).toISOString();
  const expiresAt = new Date(now + CONTACT_VERIFICATION_TTL_SEC * 1000).toISOString();

  await createAuthToken({
    id: crypto.randomUUID(),
    user_id: userId,
    token_type: tokenType,
    token_hash: hash,
    created_at: createdAt,
    expires_at: expiresAt,
  });

  await insertAudit({
    actorUserId: userId,
    entity: "user_contacts",
    action: "verification_token_requested",
    entityId: contactId,
    metadata: { type: contact.type },
  });

  return { token: raw, expiresAt };
}

export async function updatePrimaryEmail(userId: string, email: string): Promise<UserDetail> {
  const trimmed = email.trim().toLowerCase();
  if (!trimmed) {
    throw new HttpError(422, "USER_EMAIL_INVALID", "Email is required");
  }

  try {
    await upsertContact(userId, {
      type: "email",
      value: trimmed,
      isPrimary: true,
      isRecovery: true,
    });
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new HttpError(409, "USER_EMAIL_TAKEN", "Email already in use");
    }
    throw error;
  }

  await insertAudit({
    actorUserId: userId,
    entity: "user_contacts",
    action: "email_upsert",
    entityId: userId,
    metadata: { email: trimmed },
  });

  const refreshed = await fetchUserWithContacts(userId);
  if (!refreshed) {
    throw new HttpError(500, "USER_REFRESH_FAILED", "Unable to load user state");
  }
  return toUserDetail(refreshed.user, refreshed.contacts, refreshed.avatar);
}

export async function updatePhoneNumber(
  userId: string,
  phone: string,
  isRecovery = true,
): Promise<UserDetail> {
  const trimmed = phone.trim();
  if (!trimmed) {
    throw new HttpError(422, "USER_PHONE_INVALID", "Phone number is required");
  }

  try {
    await upsertContact(userId, {
      type: "phone",
      value: trimmed,
      isPrimary: false,
      isRecovery,
    });
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new HttpError(409, "USER_PHONE_TAKEN", "Phone number already in use");
    }
    throw error;
  }

  await insertAudit({
    actorUserId: userId,
    entity: "user_contacts",
    action: "phone_upsert",
    entityId: userId,
    metadata: { phone: trimmed, isRecovery },
  });

  const refreshed = await fetchUserWithContacts(userId);
  if (!refreshed) {
    throw new HttpError(500, "USER_REFRESH_FAILED", "Unable to load user state");
  }
  return toUserDetail(refreshed.user, refreshed.contacts, refreshed.avatar);
}

export async function verifyContact(
  userId: string,
  contactId: string,
  token: string,
): Promise<UserContact> {
  const contact = await getContactById(contactId);
  if (!contact || contact.user_id !== userId) {
    throw new HttpError(404, "USER_CONTACT_NOT_FOUND", "Contact not found");
  }

  if (contact.is_verified) {
    return toContact(contact);
  }

  const trimmedToken = token?.trim();
  if (!trimmedToken) {
    throw new HttpError(400, "USER_CONTACT_TOKEN_REQUIRED", "Verification token is required");
  }

  const tokenType = contactTokenType(contactId);
  const tokenHash = crypto.createHash("sha256").update(trimmedToken).digest("hex");
  const record = await findAuthToken(tokenType, tokenHash);
  if (!record || record.user_id !== userId) {
    throw new HttpError(400, "USER_CONTACT_TOKEN_INVALID", "Invalid verification token");
  }

  if (new Date(record.expires_at).getTime() <= Date.now()) {
    await consumeAuthToken(record.id);
    throw new HttpError(400, "USER_CONTACT_TOKEN_EXPIRED", "Verification token expired");
  }

  await markContactVerified(contactId);
  await consumeAuthToken(record.id);
  await markAuthTokensConsumed(userId, tokenType);

  await insertAudit({
    actorUserId: userId,
    entity: "user_contacts",
    action: "contact_verify",
    entityId: contactId,
    metadata: { type: contact.type },
  });

  const refreshed = await getContactById(contactId);
  if (!refreshed) {
    throw new HttpError(500, "USER_CONTACT_REFRESH_FAILED", "Unable to load contact");
  }
  return toContact(refreshed);
}

export async function removeContact(userId: string, contactId: string): Promise<void> {
  const contact = await getContactById(contactId);
  if (!contact || contact.user_id !== userId) {
    throw new HttpError(404, "USER_CONTACT_NOT_FOUND", "Contact not found");
  }
  if (contact.type === "email" && contact.is_primary) {
    throw new HttpError(400, "USER_CONTACT_REMOVE_PRIMARY", "Cannot remove primary email");
  }
  await deleteContact(userId, contactId);
  await insertAudit({
    actorUserId: userId,
    entity: "user_contacts",
    action: "contact_remove",
    entityId: contactId,
    metadata: { type: contact.type },
  });
}

export async function collectUserData(userId: string) {
  const user = await db<UserRow>("users").where({ id: userId }).first<UserRow>();
  if (!user) {
    throw new HttpError(404, "USER_NOT_FOUND", "User not found");
  }

  type SessionRow = { id: string; owner_id: string };
  type GenericRow = Record<string, unknown>;

  const contacts = await db<ContactRow>("user_contacts").where({ user_id: userId });
  const sessions = await db<SessionRow>("sessions").where({ owner_id: userId });
  const plans = await db<GenericRow>("plans").where({ user_id: userId });
  const exercises = await db<GenericRow>("exercises").where({ owner_id: userId });
  const exerciseSets = sessions.length
    ? await db<GenericRow>("exercise_sets").whereIn(
        "session_id",
        sessions.map((session) => session.id),
      )
    : [];
  const points = await db<GenericRow>("user_points").where({ user_id: userId });
  const followers = await db<GenericRow>("followers").where({ following_id: userId });
  const following = await db<GenericRow>("followers").where({ follower_id: userId });
  const media = await db<GenericRow>("media").where({ owner_id: userId });

  return {
    user,
    contacts,
    sessions,
    plans,
    exercises,
    exerciseSets,
    points,
    followers,
    following,
    media,
  };
}
