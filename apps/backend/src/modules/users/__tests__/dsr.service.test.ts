import type { DeleteSchedule } from "../dsr.service.js";
import { insertAudit } from "../../common/audit.util.js";
import { deleteStorageObject } from "../../../services/mediaStorage.service.js";
import { HttpError } from "../../../utils/http.js";

type TableMap = Record<string, Array<Record<string, any>>>;

const tables: TableMap = {};

function resetTables() {
  for (const key of Object.keys(tables)) {
    tables[key] = [];
  }
}

function ensureTable(name: string) {
  if (!tables[name]) {
    tables[name] = [];
  }
  return tables[name];
}

type Filter = (row: Record<string, unknown>) => boolean;

let scheduleAccountDeletion: (userId: string, now?: Date) => Promise<DeleteSchedule>;
let executeAccountDeletion: (userId: string) => Promise<void>;
let processDueAccountDeletions: (now?: Date) => Promise<number>;

function toComparable(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }
  if (typeof value === "string") {
    return value;
  }
  if (value instanceof Date) {
    return value.toISOString();
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  throw new TypeError("Unsupported comparison value");
}

class QueryBuilder {
  constructor(
    private readonly tableName: string,
    private readonly storage: TableMap,
    private readonly filters: Filter[] = [],
  ) {}

  private rows(): Record<string, unknown>[] {
    return ensureTable(this.tableName);
  }

  private apply(): Record<string, unknown>[] {
    return this.rows().filter((row) => this.filters.every((fn) => fn(row)));
  }

  where(column: string, value: unknown): QueryBuilder;
  where(criteria: Record<string, unknown>): QueryBuilder;
  where(arg1: string | Record<string, unknown>, arg2?: unknown): QueryBuilder {
    if (typeof arg1 === "string") {
      const column = arg1;
      const value = arg2;
      const predicate: Filter = (row) => row[column] === value;
      return new QueryBuilder(this.tableName, this.storage, [...this.filters, predicate]);
    }
    const criteria = arg1;
    const predicate: Filter = (row) =>
      Object.entries(criteria).every(([key, value]) => row[key] === value);
    return new QueryBuilder(this.tableName, this.storage, [...this.filters, predicate]);
  }

  whereNotNull(column: string): QueryBuilder {
    const predicate: Filter = (row) => row[column] !== null && row[column] !== undefined;
    return new QueryBuilder(this.tableName, this.storage, [...this.filters, predicate]);
  }

  andWhere(column: string, value: unknown): QueryBuilder;
  andWhere(column: string, operator: string, value: unknown): QueryBuilder;
  andWhere(column: string, operatorOrValue: unknown, maybeValue?: unknown): QueryBuilder {
    if (maybeValue === undefined) {
      return this.where(column, operatorOrValue);
    }
    const value = maybeValue;
    const operator = String(operatorOrValue);
    const predicate: Filter = (row) => {
      const current = row[column];
      if (current === undefined || current === null) {
        return false;
      }
      if (operator === "<=") {
        return toComparable(current) <= toComparable(value);
      }
      if (operator === "<") {
        return toComparable(current) < toComparable(value);
      }
      if (operator === ">=") {
        return toComparable(current) >= toComparable(value);
      }
      if (operator === ">") {
        return toComparable(current) > toComparable(value);
      }
      return toComparable(current) === toComparable(value);
    };
    return new QueryBuilder(this.tableName, this.storage, [...this.filters, predicate]);
  }

  whereIn(column: string, values: string[]): QueryBuilder {
    const predicate: Filter = (row) => values.includes(toComparable(row[column]));
    return new QueryBuilder(this.tableName, this.storage, [...this.filters, predicate]);
  }

  first<T = Record<string, unknown>>(): Promise<T | undefined> {
    return Promise.resolve(this.apply()[0] as T | undefined);
  }

  update(patch: Record<string, unknown>): Promise<number> {
    const rows = this.apply();
    for (const row of rows) {
      Object.assign(row, patch);
    }
    return Promise.resolve(rows.length);
  }

  insert(data: Record<string, unknown> | Record<string, unknown>[]): Promise<unknown> {
    const rows = Array.isArray(data) ? data : [data];
    const table = this.rows();
    for (const record of rows) {
      table.push({ ...record });
    }
    return Promise.resolve(rows);
  }

  del(): Promise<number> {
    const table = this.rows();
    const rowsToRemove = new Set(this.apply());
    const remaining = table.filter((row) => !rowsToRemove.has(row));
    const removed = table.length - remaining.length;
    tables[this.tableName] = remaining;
    return Promise.resolve(removed);
  }

  select(column?: string): Promise<Array<Record<string, unknown>>> {
    const results = this.apply();
    if (!column) {
      return Promise.resolve(results.map((row) => ({ ...row })));
    }
    return Promise.resolve(results.map((row) => ({ [column]: row[column] })));
  }

  orderBy(
    column: string,
    direction: "asc" | "desc" = "asc",
  ): Promise<Array<Record<string, unknown>>> {
    const results = [...this.apply()].sort((a, b) => {
      const leftValue = toComparable(a[column]);
      const rightValue = toComparable(b[column]);
      if (leftValue === rightValue) {
        return 0;
      }
      return leftValue > rightValue ? 1 : -1;
    });
    if (direction === "desc") {
      results.reverse();
    }
    return Promise.resolve(results.map((row) => ({ ...row })));
  }

  pluck<T = unknown>(column: string): Promise<T[]> {
    return Promise.resolve(this.apply().map((row) => row[column] as T));
  }
}

type DbMock = jest.Mock<QueryBuilder, [string]> & {
  transaction: (handler: (trx: DbMock) => Promise<unknown>) => Promise<unknown>;
};

// eslint-disable-next-line no-var
var dbMock: DbMock;

function createDbMock(): DbMock {
  const fn = jest.fn((tableName: string) => new QueryBuilder(tableName, tables)) as DbMock;
  fn.transaction = async (handler: (trx: DbMock) => Promise<unknown>) => handler(fn);
  return fn;
}

jest.mock("../../../db/connection.js", () => {
  dbMock = createDbMock();
  return {
    db: dbMock,
  };
});

jest.mock("../../common/audit.util.js", () => ({
  insertAudit: jest.fn(),
}));

jest.mock("../../../services/mediaStorage.service.js", () => ({
  deleteStorageObject: jest.fn(),
}));

jest.mock("../../../config/env.js", () => ({
  env: {
    dsr: {
      purgeDelayMinutes: 10,
      backupPurgeDays: 14,
    },
  },
}));

beforeAll(async () => {
  const mod = await import("../dsr.service.js");
  scheduleAccountDeletion = mod.scheduleAccountDeletion;
  executeAccountDeletion = mod.executeAccountDeletion;
  processDueAccountDeletions = mod.processDueAccountDeletions;
});

describe("dsr.service", () => {
  beforeEach(() => {
    resetTables();
    ensureTable("users");
    ensureTable("media");
    ensureTable("sessions");
    ensureTable("session_exercises");
    ensureTable("exercise_sets");
    ensureTable("plans");
    ensureTable("exercises");
    ensureTable("user_metrics");
    ensureTable("user_contacts");
    ensureTable("user_static");
    ensureTable("user_state_history");
    ensureTable("user_points");
    ensureTable("badges");
    ensureTable("followers");
    ensureTable("auth_tokens");
    ensureTable("refresh_tokens");
    ensureTable("auth_sessions");
    ensureTable("idempotency_keys");
    ensureTable("media");
    ensureTable("user_tombstones");
    ensureTable("audit_log");
    (insertAudit as jest.Mock).mockReset();
    (deleteStorageObject as jest.Mock).mockReset();
    dbMock.mockClear();
  });

  it("schedules account deletion with backup window metadata", async () => {
    const userId = "user-1";
    tables.users.push({
      id: userId,
      username: "demo",
      status: "pending_deletion",
      deleted_at: null,
      purge_scheduled_at: null,
      backup_purge_due_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    const schedule = await scheduleAccountDeletion(userId, new Date("2025-10-21T10:00:00.000Z"));

    expect(schedule.scheduledAt).toBeDefined();
    expect(schedule.purgeDueAt).toBeDefined();
    expect(schedule.backupPurgeDueAt).toBeDefined();
    const stored = tables.users[0];
    expect(stored.deleted_at).toEqual(schedule.scheduledAt);
    expect(stored.purge_scheduled_at).toEqual(schedule.purgeDueAt);
    expect(stored.backup_purge_due_at).toEqual(schedule.backupPurgeDueAt);
    expect(insertAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "delete_scheduled",
        entityId: userId,
      }),
    );
  });

  it("executes account deletion with cascades and tombstone", async () => {
    const userId = "user-2";
    const now = new Date().toISOString();
    tables.users.push({
      id: userId,
      username: "to-delete",
      status: "pending_deletion",
      deleted_at: now,
      purge_scheduled_at: now,
      backup_purge_due_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      created_at: now,
      updated_at: now,
    });
    tables.user_contacts.push({
      id: "contact-1",
      user_id: userId,
      type: "email",
      value: "user@example.com",
      is_primary: true,
      is_recovery: true,
      is_verified: true,
      verified_at: now,
      created_at: now,
    });
    tables.media.push({
      id: "media-1",
      owner_id: userId,
      storage_key: "media/user-2/avatar.jpg",
      target_type: "avatar",
      target_id: userId,
      file_url: "",
      mime_type: "image/jpeg",
      media_type: "image",
      bytes: 1234,
      created_at: now,
    });
    tables.sessions.push({ id: "session-1", owner_id: userId });
    tables.session_exercises.push({ id: "sess-ex-1", session_id: "session-1" });
    tables.exercise_sets.push({ id: "set-1", session_id: "session-1" });
    tables.plans.push({ id: "plan-1", user_id: userId });
    tables.exercises.push({ id: "exercise-1", owner_id: userId });
    tables.user_metrics.push({ id: "metric-1", user_id: userId });
    tables.user_static.push({ user_id: userId });
    tables.user_state_history.push({ id: "history-1", user_id: userId });
    tables.user_points.push({ id: "point-1", user_id: userId });
    tables.badges.push({ id: "badge-1", user_id: userId });
    tables.followers.push({
      id: "follow-1",
      follower_id: userId,
      following_id: "other",
      created_at: now,
    });
    tables.followers.push({
      id: "follow-2",
      follower_id: "other",
      following_id: userId,
      created_at: now,
    });
    tables.auth_tokens.push({ id: "token-1", user_id: userId });
    tables.refresh_tokens.push({ id: "rt-1", user_id: userId });
    tables.auth_sessions.push({ id: "session-auth-1", user_id: userId });
    tables.idempotency_keys.push({ id: "idem-1", user_id: userId });

    await executeAccountDeletion(userId);

    expect(tables.users).toHaveLength(0);
    expect(tables.media).toHaveLength(0);
    expect(tables.sessions).toHaveLength(0);
    expect(tables.user_contacts).toHaveLength(0);
    expect(tables.user_tombstones).toHaveLength(1);
    const tombstone = tables.user_tombstones[0];
    expect(tombstone.user_id).toBe(userId);
    expect((tombstone.metadata as { mediaRemoved: number }).mediaRemoved).toBe(1);
    expect(deleteStorageObject).toHaveBeenCalledWith("media/user-2/avatar.jpg");
    expect(deleteStorageObject).toHaveBeenCalledTimes(1);
    expect(insertAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "account_purged",
        entityId: userId,
      }),
    );
  });

  it("throws when executing deletion for non-pending user", async () => {
    tables.users.push({
      id: "user-3",
      username: "active",
      status: "active",
      deleted_at: null,
      purge_scheduled_at: null,
      backup_purge_due_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    await expect(executeAccountDeletion("user-3")).rejects.toBeInstanceOf(HttpError);
  });

  it("processes due account deletions", async () => {
    const now = new Date("2025-10-21T10:00:00.000Z");
    tables.users.push({
      id: "due-user",
      username: "pending",
      status: "pending_deletion",
      deleted_at: now.toISOString(),
      purge_scheduled_at: now.toISOString(),
      backup_purge_due_at: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
    });
    tables.users.push({
      id: "future-user",
      username: "waiting",
      status: "pending_deletion",
      deleted_at: now.toISOString(),
      purge_scheduled_at: new Date(now.getTime() + 60 * 60 * 1000).toISOString(),
      backup_purge_due_at: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
    });

    const processed = await processDueAccountDeletions(now);

    expect(processed).toBe(1);
    expect(tables.users).toHaveLength(1);
    expect(tables.users[0].id).toBe("future-user");
  });
});
