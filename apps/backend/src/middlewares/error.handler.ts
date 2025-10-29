import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { logger } from "../config/logger.js";
import { HttpError } from "../utils/http.js";

type GenericError = Error & {
  status?: number;
  code?: string;
  details?: Record<string, unknown>;
};

function normalizeError(err: unknown): HttpError {
  if (err instanceof HttpError) {
    return err;
  }

  if (err instanceof ZodError) {
    return new HttpError(400, "VALIDATION_ERROR", "VALIDATION_ERROR", err.flatten());
  }

  if (err instanceof Error) {
    const status = (err as GenericError).status ?? 500;
    const code =
      (err as GenericError).code ??
      (status === 400
        ? "BAD_REQUEST"
        : status === 401
          ? "UNAUTHENTICATED"
          : status === 403
            ? "FORBIDDEN"
            : status === 404
              ? "NOT_FOUND"
              : status === 429
                ? "RATE_LIMITED"
                : "INTERNAL_SERVER_ERROR");

    const normalized = new HttpError(status, code, err.message || "INTERNAL_SERVER_ERROR");
    if ((err as GenericError).details) {
      normalized.details = (err as GenericError).details;
    }
    return normalized;
  }

  return new HttpError(500, "INTERNAL_SERVER_ERROR", "INTERNAL_SERVER_ERROR");
}

export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
  const normalized = normalizeError(err);
  const requestId = typeof res.locals.requestId === "string" ? res.locals.requestId : undefined;
  logger.error(
    {
      err,
      status: normalized.status,
      code: normalized.code,
      requestId,
      path: req.originalUrl,
      method: req.method,
    },
    "Request failed",
  );

  res.status(normalized.status).json({
    error: {
      code: normalized.code,
      message: normalized.message,
      ...(normalized.details ? { details: normalized.details } : {}),
      requestId,
    },
  });
}
