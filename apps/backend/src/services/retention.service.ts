import type { Knex } from "knex";

import { db } from "../db/connection.js";
import { processDueAccountDeletions } from "../modules/users/dsr.service.js";

export interface RetentionSummary {
  purgedIdempotencyKeys: number;
  purgedAuthTokens: number;
  purgedRefreshTokens: number;
  processedDsrRequests: number;
}

function iso(date: Date): string {
  return date.toISOString();
}

export async function purgeStaleIdempotencyKeys(now: Date = new Date()): Promise<number> {
  const threshold = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  return db("idempotency_keys").where("created_at", "<", iso(threshold)).del();
}

export async function purgeExpiredAuthTokens(now: Date = new Date()): Promise<number> {
  return db("auth_tokens").where("expires_at", "<", iso(now)).del();
}

export async function purgeExpiredRefreshTokens(now: Date = new Date()): Promise<number> {
  const revokedThreshold = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  return db("refresh_tokens")
    .where("expires_at", "<", iso(now))
    .orWhere(function expiredRevoked(this: Knex.QueryBuilder) {
      this.whereNotNull("revoked_at").andWhere("revoked_at", "<", iso(revokedThreshold));
    })
    .del();
}

export async function runRetentionSweep(now: Date = new Date()): Promise<RetentionSummary> {
  const purgedIdempotencyKeys = await purgeStaleIdempotencyKeys(now);
  const purgedAuthTokens = await purgeExpiredAuthTokens(now);
  const purgedRefreshTokens = await purgeExpiredRefreshTokens(now);
  const processedDsrRequests = await processDueAccountDeletions(now);

  return {
    purgedIdempotencyKeys,
    purgedAuthTokens,
    purgedRefreshTokens,
    processedDsrRequests,
  };
}
