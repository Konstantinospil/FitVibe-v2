import type { NextFunction, Request, Response } from "express";

import { logger } from "../../config/logger.js";
import { HttpError } from "../../utils/http.js";

/**
 * Global error-handling middleware.
 */
export function errorHandler(err: unknown, req: Request, res: Response, next: NextFunction): void {
  logger.error({ err, requestId: res.locals.requestId }, "Unhandled application error");
  if (res.headersSent) {
    next(err instanceof Error ? err : new Error(String(err)));
    return;
  }

  if (err instanceof HttpError) {
    res.status(err.status).json({
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
        requestId: res.locals.requestId,
      },
    });
    return;
  }

  const status =
    typeof (err as { status?: number }).status === "number"
      ? (
          err as {
            status: number;
          }
        ).status
      : 500;
  const message = err instanceof Error ? err.message : "Internal server error";

  res.status(status).json({
    error: {
      code: status === 500 ? "INTERNAL_ERROR" : "UNEXPECTED_ERROR",
      message,
      requestId: res.locals.requestId,
    },
  });
}
