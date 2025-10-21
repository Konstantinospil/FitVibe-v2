import type { Request, Response } from "express";
import { z } from "zod";
import {
  getAll,
  getOne,
  createOne,
  updateOne,
  cancelOne,
  cloneOne,
  applyRecurrence,
} from "./sessions.service";
import { resolveIdempotency, persistIdempotencyResult } from "../common/idempotency.service.js";
import { HttpError } from "../../utils/http.js";

const statusEnum = z.enum(["planned", "in_progress", "completed", "canceled"]);
const visibilityEnum = z.enum(["private", "public", "link"]);

const titleSchema = z
  .string()
  .trim()
  .min(2, "Title must be at least 2 characters")
  .max(100, "Title must be at most 100 characters");

const intervalPattern =
  /^(?:P(?!$)(?:\d+Y)?(?:\d+M)?(?:\d+D)?(?:T(?:\d+H)?(?:\d+M)?(?:\d+S)?)?|(?:\d{2}):(?:\d{2})(?::(?:\d{2}))?)$/;

const intervalSchema = z
  .string()
  .regex(intervalPattern, "Interval must be ISO-8601 or HH:MM[:SS] format")
  .nullable()
  .optional();

const extrasSchema = z
  .record(z.unknown())
  .refine((value) => !Array.isArray(value), { message: "Extras must be an object" })
  .optional();

const plannedAttributesSchema = z
  .object({
    sets: z.number().int().min(0).nullable().optional(),
    reps: z.number().int().min(0).nullable().optional(),
    load: z.number().min(0).nullable().optional(),
    distance: z.number().min(0).nullable().optional(),
    duration: intervalSchema,
    rpe: z.number().int().min(1).max(10).nullable().optional(),
    rest: intervalSchema,
    extras: extrasSchema,
  })
  .strict();

const actualAttributesSchema = plannedAttributesSchema.extend({
  recorded_at: z.string().datetime().nullable().optional(),
});

const sessionSetSchema = z
  .object({
    id: z.string().uuid().optional(),
    order: z.number().int().min(1),
    reps: z.number().int().min(0).nullable().optional(),
    weight_kg: z.number().min(0).nullable().optional(),
    distance_m: z.number().min(0).nullable().optional(),
    duration_sec: z.number().int().min(0).nullable().optional(),
    rpe: z.number().int().min(1).max(10).nullable().optional(),
    notes: z.string().max(500).nullable().optional(),
  })
  .strict();

const sessionExerciseSchema = z
  .object({
    id: z.string().uuid().optional(),
    exercise_id: z.string().uuid().nullable().optional(),
    order: z.number().int().min(1),
    notes: z.string().max(1000).nullable().optional(),
    planned: plannedAttributesSchema.nullable().optional(),
    actual: actualAttributesSchema.nullable().optional(),
    sets: z.array(sessionSetSchema).max(100).optional(),
  })
  .strict();

const createSchema = z.object({
  plan_id: z.string().uuid().nullable().optional(),
  title: titleSchema.nullable().optional(),
  planned_at: z.string().datetime(),
  visibility: visibilityEnum.optional(),
  notes: z.string().max(1000).nullable().optional(),
  recurrence_rule: z.string().max(255).nullable().optional(),
  exercises: z.array(sessionExerciseSchema).max(50).optional(),
});

const updateSchema = z.object({
  plan_id: z.string().uuid().nullable().optional(),
  title: titleSchema.nullable().optional(),
  planned_at: z.string().datetime().optional(),
  status: statusEnum.optional(),
  visibility: visibilityEnum.optional(),
  notes: z.string().max(1000).nullable().optional(),
  recurrence_rule: z.string().max(255).nullable().optional(),
  started_at: z.string().datetime().optional(),
  completed_at: z.string().datetime().optional(),
  calories: z.number().int().min(0).nullable().optional(),
  points: z.number().int().min(0).nullable().optional(),
  exercises: z.array(sessionExerciseSchema).max(50).optional(),
});

const cloneSchema = z
  .object({
    planned_at: z.string().datetime().optional(),
    date_offset_days: z.number().int().min(-365).max(365).optional(),
    title: titleSchema.nullable().optional(),
    notes: z.string().max(1000).nullable().optional(),
    visibility: visibilityEnum.optional(),
    recurrence_rule: z.string().max(255).nullable().optional(),
    plan_id: z.string().uuid().nullable().optional(),
    include_actual: z.boolean().optional(),
  })
  .refine((value) => value.planned_at === undefined || value.date_offset_days === undefined, {
    message: "Provide either planned_at or date_offset_days, not both",
    path: ["planned_at"],
  });

const recurrenceSchema = z.object({
  occurrences: z.number().int().min(1).max(52),
  offset_days: z.number().int().min(1).max(180),
  start_from: z.string().datetime().optional(),
  include_actual: z.boolean().optional(),
  plan_id: z.string().uuid().nullable().optional(),
  visibility: visibilityEnum.optional(),
  title: titleSchema.nullable().optional(),
  notes: z.string().max(1000).nullable().optional(),
  recurrence_rule: z.string().max(255).nullable().optional(),
});

const querySchema = z.object({
  status: statusEnum.optional(),
  plan_id: z.string().uuid().optional(),
  planned_from: z.string().datetime().optional(),
  planned_to: z.string().datetime().optional(),
  search: z.string().trim().max(100).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  offset: z.coerce.number().int().min(0).max(10000).default(0),
});

function getIdempotencyKey(req: Request): string | null {
  const header = req.get("Idempotency-Key");
  if (!header) {
    return null;
  }
  const key = header.trim();
  if (!key) {
    throw new HttpError(400, "E.IDEMPOTENCY.INVALID", "Idempotency-Key header must not be empty");
  }
  if (key.length > 200) {
    throw new HttpError(
      400,
      "E.IDEMPOTENCY.INVALID",
      "Idempotency-Key header must be 200 characters or fewer",
    );
  }
  return key;
}

function getRouteTemplate(req: Request): string {
  const base = req.baseUrl ?? "";
  const routeInfo = req.route as unknown;
  let path = "";
  if (routeInfo && typeof routeInfo === "object" && "path" in routeInfo) {
    const candidate = (routeInfo as { path?: unknown }).path;
    if (typeof candidate === "string") {
      path = candidate;
    }
  }
  const combined = `${base}${path}`.replace(/\/{2,}/g, "/");
  const trimmed =
    combined.length > 1 && combined.endsWith("/") ? combined.slice(0, -1) : combined || "/";
  return trimmed || "/";
}

function requireUser(req: Request, res: Response): string | null {
  const candidate = req.user;
  if (candidate && typeof candidate === "object" && "sub" in candidate) {
    const sub = (candidate as { sub?: unknown }).sub;
    if (typeof sub === "string") {
      return sub;
    }
  }
  res.status(401).json({ error: "Unauthorized" });
  return null;
}

export async function listSessionsHandler(req: Request, res: Response): Promise<void> {
  const userId = requireUser(req, res);
  if (!userId) {
    return;
  }

  const parsed = querySchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const result = await getAll(userId, parsed.data);
  res.json(result);
}

export async function getSessionHandler(req: Request, res: Response): Promise<void> {
  const userId = requireUser(req, res);
  if (!userId) {
    return;
  }

  const { id } = req.params;
  const result = await getOne(userId, id);
  res.json(result);
}

export async function createSessionHandler(req: Request, res: Response): Promise<void> {
  const userId = requireUser(req, res);
  if (!userId) {
    return;
  }

  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const key = getIdempotencyKey(req);
  let recordId: string | null = null;
  if (key) {
    const resolution = await resolveIdempotency(
      {
        userId,
        method: req.method.toUpperCase(),
        route: getRouteTemplate(req),
        key,
      },
      parsed.data,
    );
    if (resolution.type === "replay") {
      res.set("Idempotency-Key", key);
      res.set("Idempotent-Replayed", "true");
      res.status(resolution.status).json(resolution.body);
      return;
    }
    recordId = resolution.recordId;
  }

  const created = await createOne(userId, parsed.data);

  if (key && recordId) {
    await persistIdempotencyResult(recordId, 201, created);
    res.set("Idempotency-Key", key);
  } else if (key) {
    res.set("Idempotency-Key", key);
  }

  res.status(201).json(created);
}

export async function updateSessionHandler(req: Request, res: Response): Promise<void> {
  const userId = requireUser(req, res);
  if (!userId) {
    return;
  }

  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const { id } = req.params;
  const updated = await updateOne(userId, id, parsed.data);
  res.json(updated);
}

export async function cloneSessionHandler(req: Request, res: Response): Promise<void> {
  const userId = requireUser(req, res);
  if (!userId) {
    return;
  }

  const parsed = cloneSchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const key = getIdempotencyKey(req);
  let recordId: string | null = null;
  if (key) {
    const resolution = await resolveIdempotency(
      {
        userId,
        method: req.method.toUpperCase(),
        route: getRouteTemplate(req),
        key,
      },
      { source_id: req.params.id, ...parsed.data },
    );
    if (resolution.type === "replay") {
      res.set("Idempotency-Key", key);
      res.set("Idempotent-Replayed", "true");
      res.status(resolution.status).json(resolution.body);
      return;
    }
    recordId = resolution.recordId;
  }

  const cloned = await cloneOne(userId, req.params.id, parsed.data);

  if (key && recordId) {
    await persistIdempotencyResult(recordId, 201, cloned);
    res.set("Idempotency-Key", key);
  } else if (key) {
    res.set("Idempotency-Key", key);
  }

  res.status(201).json(cloned);
}

export async function applyRecurrenceHandler(req: Request, res: Response): Promise<void> {
  const userId = requireUser(req, res);
  if (!userId) {
    return;
  }

  const parsed = recurrenceSchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const key = getIdempotencyKey(req);
  let recordId: string | null = null;
  if (key) {
    const resolution = await resolveIdempotency(
      {
        userId,
        method: req.method.toUpperCase(),
        route: getRouteTemplate(req),
        key,
      },
      { source_id: req.params.id, ...parsed.data },
    );
    if (resolution.type === "replay") {
      res.set("Idempotency-Key", key);
      res.set("Idempotent-Replayed", "true");
      res.status(resolution.status).json(resolution.body);
      return;
    }
    recordId = resolution.recordId;
  }

  const sessions = await applyRecurrence(userId, req.params.id, parsed.data);

  if (key && recordId) {
    await persistIdempotencyResult(recordId, 201, { sessions });
    res.set("Idempotency-Key", key);
  } else if (key) {
    res.set("Idempotency-Key", key);
  }

  res.status(201).json({ sessions });
}

export async function deleteSessionHandler(req: Request, res: Response): Promise<void> {
  const userId = requireUser(req, res);
  if (!userId) {
    return;
  }

  const { id } = req.params;
  await cancelOne(userId, id);
  res.status(204).send();
}
