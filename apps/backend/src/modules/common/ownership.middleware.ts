import { Request, Response, NextFunction } from 'express';
import { db } from '../../db/connection.js';

/**
 * Ensures the current user owns the resource being modified.
 * Example: router.patch('/:id', requireAuth, ownerGuard('sessions'))
 */
export function ownerGuard(table: string, param = 'id') {
  return async (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;
    const userId = user?.sub ?? user?.id; // support current JWT payload
    const resourceId = req.params[param];
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    try {
      const record = await db(table).where({ id: resourceId }).first();
      if (!record) return res.status(404).json({ error: 'Not found' });
      if (record.user_id !== userId) return res.status(403).json({ error: 'Forbidden' });
      next();
    } catch (err) {
      console.error('Ownership check failed:', err);
      res.status(500).json({ error: 'Server error' });
    }
  };
}
