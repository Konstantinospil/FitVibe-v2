import type { NextFunction, Request, RequestHandler, Response } from "express";
import type { ZodSchema } from "zod";

import { HttpError } from "./http.js";

type RequestSegment = "body" | "query" | "params";

/**
 * Validate request body/query/params using Zod schemas and propagate the parsed
 * value back onto the request object. The successfully parsed payload is also
 * stored on `req.validated` for downstream consumers that prefer a single hook.
 */
export function validate<T>(schema: ZodSchema<T>, target: RequestSegment = "body"): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    const currentValue =
      target === "body"
        ? (req.body as unknown)
        : target === "query"
          ? (req.query as unknown)
          : (req.params as unknown);
    const result = schema.safeParse(currentValue);
    if (!result.success) {
      throw new HttpError(400, "VALIDATION_ERROR", "Validation failed", result.error.flatten());
    }

    const parsed = result.data;

    if (target === "body") {
      (req as Request & { body: T }).body = parsed;
    } else if (target === "query") {
      (req as Request & { query: T }).query = parsed;
    } else {
      (req as Request & { params: T }).params = parsed;
    }

    (req as Request & { validated?: T }).validated = parsed;
    next();
  };
}
