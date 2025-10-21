import { createHash } from "node:crypto";

import { db } from "../../db/connection.js";
import { HttpError } from "../../utils/http.js";

const TABLE = "idempotency_keys";

export interface IdempotencyContext {
  userId: string;
  method: string;
  route: string;
  key: string;
}

type ResolutionBase =
  | { type: "new" | "pending"; recordId: string }
  | { type: "replay"; status: number; body: unknown };

export interface IdempotencyRow {
  id: string;
  request_hash: string;
  response_status: number | null;
  response_body: unknown;
}

function serializationReplacer(_key: string, value: unknown): unknown {
  return value === undefined ? null : value;
}

function computeHash(payload: unknown): string {
  const serialized: string =
    payload === undefined
      ? "undefined"
      : (JSON.stringify(payload, serializationReplacer) ?? "null");
  return createHash("sha256").update(serialized).digest("hex");
}

function buildWhere(context: IdempotencyContext) {
  return {
    user_id: context.userId,
    method: context.method,
    route: context.route,
    key: context.key,
  };
}

export async function resolveIdempotency(
  context: IdempotencyContext,
  payload: unknown,
): Promise<ResolutionBase> {
  const requestHash = computeHash(payload);
  const now = new Date().toISOString();

  const inserted = await db(TABLE)
    .insert({
      user_id: context.userId,
      method: context.method,
      route: context.route,
      key: context.key,
      request_hash: requestHash,
      created_at: now,
      updated_at: now,
    })
    .onConflict(["user_id", "method", "route", "key"])
    .ignore()
    .returning<IdempotencyRow[]>("*");

  if (inserted.length > 0) {
    return { type: "new", recordId: inserted[0].id };
  }

  const existing = await db<IdempotencyRow>(TABLE).where(buildWhere(context)).first();

  if (!existing) {
    // unlikely race: retry insert once
    const [retry] = await db(TABLE)
      .insert({
        user_id: context.userId,
        method: context.method,
        route: context.route,
        key: context.key,
        request_hash: requestHash,
        created_at: now,
        updated_at: now,
      })
      .onConflict(["user_id", "method", "route", "key"])
      .ignore()
      .returning<IdempotencyRow[]>("*");
    if (retry) {
      return { type: "new", recordId: retry.id };
    }
    throw new HttpError(500, "E.IDEMPOTENCY.STATE", "Unable to initialize idempotency record");
  }

  if (existing.request_hash !== requestHash) {
    throw new HttpError(
      409,
      "E.IDEMPOTENCY.MISMATCH",
      "Idempotency key already used with a different payload",
    );
  }

  if (existing.response_status !== null && existing.response_body !== null) {
    return {
      type: "replay",
      status: existing.response_status,
      body: existing.response_body,
    };
  }

  return { type: "pending", recordId: existing.id };
}

export async function persistIdempotencyResult(
  recordId: string,
  status: number,
  body: unknown,
): Promise<void> {
  await db(TABLE)
    .where({ id: recordId })
    .update({
      response_status: status,
      response_body: body ?? null,
      updated_at: new Date().toISOString(),
    });
}
