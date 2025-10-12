import { Request, Response, NextFunction } from 'express';

/**
 * Global error-handling middleware.
 */
export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  console.error('Error:', err);
  if (res.headersSent) return next(err);
  const status = err.status || 500;
  const message = err.message || 'Internal server error';
  res.status(status).json({ error: message });
}
