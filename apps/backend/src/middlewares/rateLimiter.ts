import { RateLimiterMemory } from 'rate-limiter-flexible';
import { Request, Response, NextFunction } from 'express';

const limiters = new Map<string, RateLimiterMemory>();

function getLimiter(key: string, points = 60, duration = 60) {
  if (!limiters.has(key)) {
    limiters.set(key, new RateLimiterMemory({ keyPrefix: key, points, duration }));
  }
  return limiters.get(key)!;
}

/**
 * Apply a per-IP rate limit.
 * Example: app.post('/login', rateLimit('login', 5, 60), handler)
 */
export function rateLimit(key: string, points = 60, duration = 60) {
  const limiter = getLimiter(key, points, duration);
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
      await limiter.consume(String(ip));
      return next();
    } catch {
      res.status(429).json({
        error: {
          code: "RATE_LIMITED",
          message: "Too many requests",
          requestId: res.locals.requestId,
        },
      });
    }
  };
}
