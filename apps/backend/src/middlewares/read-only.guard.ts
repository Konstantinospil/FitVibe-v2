import type { Request, Response, NextFunction } from "express";
import { env } from "../config/env.js";
import { logger } from "../config/logger.js";

/**
 * HTTP methods that mutate data.
 * When READ_ONLY_MODE is enabled, these methods will be blocked.
 */
const MUTATION_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

/**
 * Paths that are always allowed even in read-only mode.
 * These are typically read-only operations or critical system endpoints.
 */
const ALWAYS_ALLOWED_PATHS = new Set([
  "/health",
  "/metrics",
  "/.well-known/jwks.json",
  "/api/v1/system/read-only/status", // Allow checking read-only status
  "/api/v1/system/read-only/enable", // Allow admin to enable/disable
  "/api/v1/system/read-only/disable",
  "/api/v1/auth/refresh", // Allow token refresh (no DB write)
]);

/**
 * Middleware to enforce read-only mode.
 * When enabled via READ_ONLY_MODE env variable, all mutation requests
 * (POST, PUT, PATCH, DELETE) will be rejected with 503 Service Unavailable.
 *
 * This is useful for:
 * - Planned maintenance windows
 * - Emergency response to system issues
 * - Database migration safety
 * - Incident response
 *
 * @example
 * // Enable read-only mode
 * READ_ONLY_MODE=true npm run dev
 *
 * @example
 * // Enable with custom message
 * READ_ONLY_MODE=true MAINTENANCE_MESSAGE="Scheduled maintenance in progress" npm run dev
 */
export function readOnlyGuard(req: Request, res: Response, next: NextFunction): void | Response {
  // Always allow safe methods (GET, HEAD, OPTIONS)
  if (!MUTATION_METHODS.has(req.method)) {
    return next();
  }

  // Always allow specific paths even during maintenance
  if (ALWAYS_ALLOWED_PATHS.has(req.path)) {
    return next();
  }

  // Check if read-only mode is enabled
  if (env.readOnlyMode) {
    logger.warn(
      {
        method: req.method,
        path: req.path,
        ip: req.ip,
        userId: req.user?.sub,
        requestId: res.locals.requestId,
      },
      "[read-only] Mutation request blocked",
    );

    return res.status(503).json({
      error: {
        code: "E.SYSTEM.READ_ONLY",
        message: env.maintenanceMessage,
        details: {
          readOnlyMode: true,
          method: req.method,
          path: req.path,
        },
        requestId: res.locals.requestId,
      },
    });
  }

  next();
}
