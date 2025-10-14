import bcrypt from "bcryptjs";
import crypto from "crypto";
import { findUserById, updateUser, listUsers, changePassword, deactivateUser } from "./users.repository.js";
import { UpdateProfileDTO, ChangePasswordDTO, UserSafe } from "./users.types.js";
import { db } from "../../db/connection.js";
import { revokeRefreshByUserId } from "../auth/auth.repository.js";
import { assertPasswordPolicy } from "../auth/passwordPolicy.js";
import { HttpError } from "../../utils/http.js";

export async function getMe(id: string): Promise<UserSafe | null> {
  const user = await findUserById(id);
  if (!user) return null;
  return { id: user.id, email: user.email, username: user.username, role: user.role, status: user.status, created_at: user.created_at, profile: user.profile };
}

export async function listAll(limit = 50, offset = 0) {
  return await listUsers(limit, offset);
}

async function insertAudit(user_id: string, action: string, meta?: Record<string, unknown>) {
  await db("audit_log").insert({
    id: crypto.randomUUID(),
    actor_user_id: user_id,
    action,
    entity: "users",
    metadata: meta,
    created_at: new Date().toISOString(),
  });
}

export async function updateProfile(id: string, dto: UpdateProfileDTO) {
  const nextUsername = dto.username?.trim();
  if (nextUsername) {
    const conflict = await db("users")
      .whereRaw("LOWER(username) = ?", [nextUsername.toLowerCase()])
      .whereNot({ id })
      .first();
    if (conflict) {
      throw new HttpError(409, "USER_USERNAME_TAKEN", "Username already in use");
    }
  }

  await updateUser(id, {
    username: nextUsername,
    profile: { locale: dto.locale, bio: dto.bio },
  });

  await insertAudit(id, "update_profile", {
    changed: {
      username: nextUsername ?? null,
      locale: dto.locale ?? null,
      bio: dto.bio ?? null,
    },
  });

  return getMe(id);
}

export async function updatePassword(id: string, dto: ChangePasswordDTO) {
  const user = await findUserById(id);
  if (!user) throw new HttpError(404, "USER_NOT_FOUND", "User not found");
  const ok = await bcrypt.compare(dto.currentPassword, user.password_hash);
  if (!ok) throw new HttpError(401, "USER_INVALID_PASSWORD", "Invalid current password");

  assertPasswordPolicy(dto.newPassword, { email: user.email, username: user.username });
  const newHash = await bcrypt.hash(dto.newPassword, 12);
  await changePassword(id, newHash);
  await revokeRefreshByUserId(id);
  await insertAudit(id, "change_password", { rotatedSessions: true });
}

export async function deactivate(id: string) {
  await deactivateUser(id);
  await revokeRefreshByUserId(id); // revoke all active sessions
  await insertAudit(id, "deactivate_account");
}

export async function collectUserData(userId: string) {
  const [user] = await db("users").where({ id: userId });
  const sessions = await db("sessions").where({ owner_id: userId });
  const plans = await db("plans").where({ user_id: userId });
  const logs = await db("exercise_sets").whereIn(
    "session_id",
    sessions.map((s) => s.id),
  );
  const points = await db("points").where({ user_id: userId });
  const feed = await db("feed_posts").where({ author_id: userId });
  return { user, sessions, plans, logs, points, feed };
}
