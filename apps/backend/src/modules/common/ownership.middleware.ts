import type { NextFunction, Request, Response } from "express";

import { db } from "../../db/connection.js";
import { logger } from "../../config/logger.js";

/**
 * Ensures the current user owns the resource being modified.
 * Example: router.patch('/:id', requireAuth, ownerGuard('sessions'))
 */
export function ownerGuard(table: string, param = "id") {
  return async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user?.sub ?? null;
    const resourceId = req.params[param];
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    if (!resourceId) {
      return res.status(400).json({ error: "Invalid resource identifier" });
    }
    try {
      const record = await db<{ id: string; user_id?: string; owner_id?: string }>(table)
        .where("id", resourceId)
        .first();
      if (!record) {
        return res.status(404).json({ error: "Not found" });
      }
      const ownsResource =
        (record.user_id !== undefined && record.user_id === userId) ||
        (record.owner_id !== undefined && record.owner_id === userId);
      if (!ownsResource) {
        return res.status(403).json({ error: "Forbidden" });
      }
      next();
    } catch (err) {
      logger.error({ err, table, resourceId, userId }, "Ownership check failed");
      res.status(500).json({ error: "Server error" });
    }
  };
}
