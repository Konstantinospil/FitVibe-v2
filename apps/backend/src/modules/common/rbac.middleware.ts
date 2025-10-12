import { Request, Response, NextFunction } from 'express';

/**
 * Role-based access control middleware.
 * Usage: router.get('/admin', requireRole('admin'), handler)
 */
export function requireRole(roles: string[] | string) {
  const allowed = Array.isArray(roles) ? roles : [roles];
  return (req: Request, res: Response, next: NextFunction) => {
    const role = (req as any).user?.role;
    if (!role) return res.status(401).json({ error: 'Unauthorized' });
    if (!allowed.includes(role)) return res.status(403).json({ error: 'Forbidden' });
    next();
  };
}
