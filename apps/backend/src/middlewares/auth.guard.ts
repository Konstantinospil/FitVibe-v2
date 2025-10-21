import type { NextFunction, Request, Response } from "express";

import { verifyAccess } from "../services/tokens.js";

export function authenticate(req: Request, res: Response, next: NextFunction) {
  const auth = req.headers.authorization;
  if (!auth) {
    return res.status(401).json({
      error: {
        code: "UNAUTHENTICATED",
        message: "Missing Authorization header",
        requestId: res.locals.requestId,
      },
    });
  }
  const token = auth.split(" ")[1];
  try {
    const payload = verifyAccess(token);
    req.user = payload;
    return next();
  } catch {
    return res.status(401).json({
      error: {
        code: "UNAUTHENTICATED",
        message: "Invalid or expired token",
        requestId: res.locals.requestId,
      },
    });
  }
}
