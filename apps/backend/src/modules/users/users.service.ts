import bcrypt from "bcryptjs";
import { db } from "../../db/connection.js";
import {
  findUserById,
  listUsers as listUserRows,
  changePassword,
  updateUserProfile,
  setUserStatus,
  fetchUserWithContacts,
  insertStateHistory,
  getUserContacts,
  upsertContact,
  markContactVerified,
  deleteContact,
  getContactById,
  ContactRow,
  UserRow,
} from "./users.repository.js";
import {
  UpdateProfileDTO,
  ChangePasswordDTO,
  UserSafe,
  UserDetail,
  UserStatus,
  UserContact,
} from "./users.types.js";
import { revokeRefreshByUserId } from "../auth/auth.repository.js";
import { assertPasswordPolicy } from "../auth/passwordPolicy.js";
import { HttpError } from "../../utils/http.js";
import { insertAudit } from "../common/audit.util.js";

const USERNAME_REGEX = /^[a-zA-Z0-9_.-]{3,50}$/;
const STATUS_TRANSITIONS: Record<UserStatus, UserStatus[]> = {
  pending_verification: ["active", "archived", "pending_deletion"],
  active: ["archived", "pending_deletion"],
  archived: ["active", "pending_deletion"],
  pending_deletion: [],
};

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

function toUserDetail(user: UserRow, contacts: ContactRow[]): UserDetail {
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
    contacts: contacts.map(toContact),
  };
}

function toUserSafe(row: any): UserSafe {
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
  };
}

async function ensureUsernameAvailable(userId: string, username: string) {
  const normalized = username.toLowerCase();
  const conflict = await db("users")
    .whereRaw("LOWER(username) = ?", [normalized])
    .whereNot({ id: userId })
    .first();
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
    throw new HttpError(400, "USER_STATUS_INVALID", `Cannot transition status from ${current} to ${next}`);
  }
}

function isUniqueViolation(error: unknown): boolean {
  return Boolean(error && typeof error === "object" && (error as any).code === "23505");
}

export async function getMe(id: string): Promise<UserDetail | null> {
  const full = await fetchUserWithContacts(id);
  if (!full) return null;
  return toUserDetail(full.user, full.contacts);
}

export async function listAll(limit = 50, offset = 0): Promise<UserSafe[]> {
  const rows = await listUserRows(limit, offset);
  return rows.map(toUserSafe);
}

export async function updateProfile(userId: string, dto: UpdateProfileDTO): Promise<UserDetail> {
  const user = await findUserById(userId);
  if (!user) throw new HttpError(404, "USER_NOT_FOUND", "User not found");

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
    changes.preferred_lang = { old: user.preferred_lang, next: dto.preferredLang };
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
  if (!updated) throw new HttpError(500, "USER_REFRESH_FAILED", "Unable to load updated profile");
  return toUserDetail(updated.user, updated.contacts);
}

export async function updatePassword(userId: string, dto: ChangePasswordDTO): Promise<void> {
  const user = await findUserById(userId);
  if (!user) throw new HttpError(404, "USER_NOT_FOUND", "User not found");

  const ok = await bcrypt.compare(dto.currentPassword, user.password_hash);
  if (!ok) throw new HttpError(401, "USER_INVALID_PASSWORD", "Invalid current password");

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
  if (!user) throw new HttpError(404, "USER_NOT_FOUND", "User not found");
  if (user.status === nextStatus) {
    const full = await fetchUserWithContacts(userId);
    if (!full) throw new HttpError(500, "USER_REFRESH_FAILED", "Unable to load user state");
    return toUserDetail(full.user, full.contacts);
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
  if (!refreshed) throw new HttpError(500, "USER_REFRESH_FAILED", "Unable to load user state");
  return toUserDetail(refreshed.user, refreshed.contacts);
}

export async function deactivate(userId: string): Promise<UserDetail> {
  return changeStatus(userId, userId, "archived");
}

export async function listContacts(userId: string): Promise<UserContact[]> {
  const contacts = await getUserContacts(userId);
  return contacts.map(toContact);
}

export async function updatePrimaryEmail(userId: string, email: string): Promise<UserDetail> {
  const trimmed = email.trim().toLowerCase();
  if (!trimmed) {
    throw new HttpError(422, "USER_EMAIL_INVALID", "Email is required");
  }

  try {
    await upsertContact(userId, { type: "email", value: trimmed, isPrimary: true, isRecovery: true });
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
  if (!refreshed) throw new HttpError(500, "USER_REFRESH_FAILED", "Unable to load user state");
  return toUserDetail(refreshed.user, refreshed.contacts);
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
    await upsertContact(userId, { type: "phone", value: trimmed, isPrimary: false, isRecovery });
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
  if (!refreshed) throw new HttpError(500, "USER_REFRESH_FAILED", "Unable to load user state");
  return toUserDetail(refreshed.user, refreshed.contacts);
}

export async function verifyContact(userId: string, contactId: string): Promise<UserContact> {
  const contact = await getContactById(contactId);
  if (!contact || contact.user_id !== userId) {
    throw new HttpError(404, "USER_CONTACT_NOT_FOUND", "Contact not found");
  }
  if (!contact.is_verified) {
    await markContactVerified(contactId);
    await insertAudit({
      actorUserId: userId,
      entity: "user_contacts",
      action: "contact_verify",
      entityId: contactId,
      metadata: { type: contact.type },
    });
  }
  const refreshed = await getContactById(contactId);
  if (!refreshed) throw new HttpError(500, "USER_CONTACT_REFRESH_FAILED", "Unable to load contact");
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
  const user = await db("users").where({ id: userId }).first();
  if (!user) throw new HttpError(404, "USER_NOT_FOUND", "User not found");

  const contacts = await db("user_contacts").where({ user_id: userId });
  const sessions = await db("sessions").where({ owner_id: userId });
  const plans = await db("plans").where({ user_id: userId });
  const exercises = await db("exercises").where({ owner_id: userId });
  const exerciseSets = sessions.length
    ? await db("exercise_sets").whereIn(
        "session_id",
        sessions.map((session) => session.id),
      )
    : [];
  const points = await db("user_points").where({ user_id: userId });
  const followers = await db("followers").where({ following_id: userId });
  const following = await db("followers").where({ follower_id: userId });
  const media = await db("media").where({ owner_id: userId });

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
