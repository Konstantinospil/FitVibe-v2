// apps/backend/src/modules/system/system.routes.ts
/**
 * Health & system status routes
 * B-CC-6 — readiness/liveness probe
 */
import { Router, Request, Response } from "express";
import pkg from "../../../package.json" assert { type: "json" };

const router = Router();

router.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({
    status: "ok",
    uptime: process.uptime(),
    version: pkg.version,
    timestamp: new Date().toISOString(),
  });
});

export default router;
