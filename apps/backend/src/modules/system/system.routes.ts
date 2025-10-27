// apps/backend/src/modules/system/system.routes.ts
/**
 * Health & system status routes
 * B-CC-6 — readiness/liveness probe
 * B-CC-9 — read-only mode kill-switch
 */
import type { Request, Response } from "express";
import { Router } from "express";
import pkg from "../../../package.json";
import { env } from "../../config/env.js";
import { requireAuth } from "../users/users.middleware.js";
import { requireRole } from "../common/rbac.middleware.js";
import { asyncHandler } from "../../utils/async-handler.js";
import { insertAudit } from "../common/audit.util.js";
import { logger } from "../../config/logger.js";

const router = Router();

/**
 * Health check endpoint
 * Always accessible, even in read-only mode
 */
router.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({
    status: "ok",
    uptime: process.uptime(),
    version: pkg.version,
    timestamp: new Date().toISOString(),
  });
});

/**
 * Get read-only mode status
 * Public endpoint - anyone can check if system is in maintenance
 */
router.get(
  "/read-only/status",
  asyncHandler(async (_req: Request, res: Response) => {
    res.status(200).json({
      readOnlyMode: env.readOnlyMode,
      message: env.readOnlyMode ? env.maintenanceMessage : null,
      timestamp: new Date().toISOString(),
    });
  }),
);

/**
 * Enable read-only mode
 * Admin-only endpoint for emergency maintenance
 *
 * @example
 * POST /api/v1/system/read-only/enable
 * {
 *   "reason": "Emergency database maintenance",
 *   "estimatedDuration": "30 minutes"
 * }
 */
router.post(
  "/read-only/enable",
  requireAuth,
  requireRole("admin"),
  asyncHandler(async (req: Request, res: Response) => {
    const previousState = env.readOnlyMode;

    // Enable read-only mode (Note: This is runtime-only, not persisted)
    // For persistent changes, update environment variable and restart
    (env as { readOnlyMode: boolean }).readOnlyMode = true;

    logger.warn(
      {
        actorUserId: req.user?.sub,
        reason: req.body.reason,
        estimatedDuration: req.body.estimatedDuration,
        previousState,
      },
      "[system] Read-only mode ENABLED",
    );

    await insertAudit({
      actorUserId: req.user?.sub as string,
      entity: "system",
      action: "read_only_enabled",
      entityId: "system",
      metadata: {
        reason: req.body.reason || "Manual activation",
        estimatedDuration: req.body.estimatedDuration,
        previousState,
      },
    });

    res.status(200).json({
      success: true,
      readOnlyMode: true,
      message: "Read-only mode has been enabled. All mutation requests will be blocked.",
      timestamp: new Date().toISOString(),
    });
  }),
);

/**
 * Disable read-only mode
 * Admin-only endpoint to restore normal operations
 *
 * @example
 * POST /api/v1/system/read-only/disable
 * {
 *   "notes": "Maintenance completed successfully"
 * }
 */
router.post(
  "/read-only/disable",
  requireAuth,
  requireRole("admin"),
  asyncHandler(async (req: Request, res: Response) => {
    const previousState = env.readOnlyMode;

    // Disable read-only mode
    (env as { readOnlyMode: boolean }).readOnlyMode = false;

    logger.info(
      {
        actorUserId: req.user?.sub,
        notes: req.body.notes,
        previousState,
      },
      "[system] Read-only mode DISABLED",
    );

    await insertAudit({
      actorUserId: req.user?.sub as string,
      entity: "system",
      action: "read_only_disabled",
      entityId: "system",
      metadata: {
        notes: req.body.notes || "Manual deactivation",
        previousState,
      },
    });

    res.status(200).json({
      success: true,
      readOnlyMode: false,
      message: "Read-only mode has been disabled. System is back to normal operation.",
      timestamp: new Date().toISOString(),
    });
  }),
);

export default router;
