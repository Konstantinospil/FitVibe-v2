import type { NextFunction, Request, Response } from "express";

import { env } from "../../config/env.js";
import { HttpError } from "../../utils/http.js";
import { verifyAccess } from "../../services/tokens.js";

function bearerToken(header?: string | null): string | null {
  if (!header) {
    return null;
  }
  const [scheme, value] = header.split(" ");
  if (!value || scheme.toLowerCase() !== "bearer") {
    return null;
  }
  return value;
}

export function requireAccessToken(req: Request, _res: Response, next: NextFunction) {
  const token =
    (req.cookies?.[env.ACCESS_COOKIE_NAME] as string | undefined) ??
    bearerToken(req.headers.authorization ?? null);
  if (!token) {
    return next(new HttpError(401, "UNAUTHENTICATED", "Access token required"));
  }

  try {
    const payload = verifyAccess(token);
    req.user = payload;
    return next();
  } catch {
    return next(new HttpError(401, "UNAUTHENTICATED", "Invalid or expired access token"));
  }
}
