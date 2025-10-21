import { createHash } from "node:crypto";

import {
  resolveIdempotency,
  persistIdempotencyResult,
  type IdempotencyRow,
} from "../idempotency.service";
import { HttpError } from "../../../utils/http";
import { db } from "../../../db/connection.js";

jest.mock("../../../db/connection.js", () => ({
  db: jest.fn(),
}));

type DbMock = jest.Mock & { transaction?: jest.Mock };

const dbMock = db as unknown as DbMock;

function buildInsertBuilder(value: IdempotencyRow[]) {
  const builder = {
    onConflict: () => builder,
    ignore: () => builder,
    returning: () => Promise.resolve(value),
  };
  return builder;
}

function buildWhereBuilder(value: IdempotencyRow | undefined) {
  return {
    first: () => Promise.resolve(value),
  };
}

describe("idempotency.service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const context = {
    userId: "user-1",
    method: "POST",
    route: "/sessions",
    key: "key-123",
  };

  it("registers a new idempotency record when key is unused", async () => {
    dbMock.mockReturnValueOnce({
      insert: () =>
        buildInsertBuilder([
          {
            id: "rec-1",
            request_hash: "hash",
            response_status: null,
            response_body: null,
          },
        ]),
    } as unknown);

    const result = await resolveIdempotency(context, { foo: "bar" });

    expect(result).toEqual({ type: "new", recordId: "rec-1" });
  });

  it("replays stored response when payload matches and response is saved", async () => {
    const payload = { foo: "bar" };
    const sanitize = (_: string, value: unknown): unknown => (value === undefined ? null : value);
    const sameHash = createHash("sha256")
      .update(JSON.stringify(payload, sanitize) ?? "null")
      .digest("hex");

    dbMock
      .mockReturnValueOnce({
        insert: () => buildInsertBuilder([]),
      } as unknown)
      .mockReturnValueOnce({
        where: () =>
          buildWhereBuilder({
            id: "rec-2",
            request_hash: sameHash,
            response_status: 201,
            response_body: { id: "session-1" },
          }),
      } as unknown);

    const result = await resolveIdempotency(context, payload);

    expect(result).toEqual({
      type: "replay",
      status: 201,
      body: { id: "session-1" },
    });
  });

  it("throws when same key is reused with different payload", async () => {
    const payload = { foo: "bar" };
    dbMock
      .mockReturnValueOnce({
        insert: () => buildInsertBuilder([]),
      } as unknown)
      .mockReturnValueOnce({
        where: () =>
          buildWhereBuilder({
            id: "rec-3",
            request_hash: "different-hash",
            response_status: null,
            response_body: null,
          }),
      } as unknown);

    await expect(resolveIdempotency(context, payload)).rejects.toBeInstanceOf(HttpError);
  });

  it("persists mutation results", async () => {
    const update = jest.fn().mockResolvedValue(1);
    dbMock.mockReturnValueOnce({
      where: jest.fn().mockReturnValue({ update }),
    } as unknown);

    await persistIdempotencyResult("rec-4", 201, { id: "session-99" });

    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        response_status: 201,
        response_body: { id: "session-99" },
      }),
    );
  });
});
