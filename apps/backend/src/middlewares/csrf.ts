// apps/backend/src/middlewares/csrf.ts
/**
 * CSRF middleware - integrates csurf (cookie mode) + optional origin/referrer check.
 * Usage: mount after cookieParser and before routes.
 */

import { Request, Response, NextFunction } from "express";
import csurf from "csurf";
import { env } from "../config/env.js";

// use cookie-based csurf so server does not rely on sessions
export const csrfProtection = csurf({
  cookie: {
    httpOnly: true,
    sameSite: "lax",
    secure: env.isProduction,
  },
});

// helper to return token to frontend (frontend reads this and sends header)
export function csrfTokenRoute(req: Request, res: Response) {
  // req.csrfToken() requires csurf() to have run (so cookie secret exists)
  const token = (req as any).csrfToken?.() ?? null;
  res.json({ csrfToken: token });
}

// additional origin/referrer check (optional but recommended)
export function validateOrigin(allowedOrigins: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const method = req.method.toUpperCase();
    if (["GET", "HEAD", "OPTIONS"].includes(method)) return next();

    const origin = req.headers["origin"] as string | undefined;
    const referer = req.headers["referer"] as string | undefined;

    if (origin) {
      if (allowedOrigins.includes(origin)) return next();
      return res.status(403).json({ error: { code: "FORBIDDEN", message: "Origin not allowed" }});
    }

    if (referer) {
      // naive host check
      try {
        const refererHost = new URL(referer).origin;
        if (allowedOrigins.includes(refererHost)) return next();
        return res.status(403).json({ error: { code: "FORBIDDEN", message: "Referer not allowed" }});
      } catch {
        return res.status(403).json({ error: { code: "FORBIDDEN", message: "Invalid referer" }});
      }
    }

    // No origin/referer header => for browser requests this is suspicious for state changes
    return res.status(403).json({ error: { code: "FORBIDDEN", message: "Missing Origin/Referer header" }});
  };
}
