import type { NextFunction, Request, Response } from "express";
import {
  register as doRegister,
  login as doLogin,
  refresh as doRefresh,
  logout as doLogout,
  verifyEmail as doVerifyEmail,
  requestPasswordReset,
  resetPassword as doResetPassword,
  listSessions as doListSessions,
  revokeSessions as doRevokeSessions,
} from "./auth.service.js";
import { env, JWKS } from "../../config/env.js";
import {
  RegisterSchema,
  LoginSchema,
  ForgotPasswordSchema,
  ResetPasswordSchema,
  RevokeSessionsSchema,
} from "./auth.schemas.js";
import type { z } from "zod";
import type { LoginContext } from "./auth.types.js";
import { HttpError } from "../../utils/http.js";
import { verifyAccess } from "../../services/tokens.js";

function setRefreshCookie(res: Response, token: string) {
  res.cookie(env.REFRESH_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: env.COOKIE_SECURE,
    domain: env.COOKIE_DOMAIN,
    maxAge: env.REFRESH_TOKEN_TTL * 1000,
  });
}

function setAccessCookie(res: Response, token: string) {
  res.cookie(env.ACCESS_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: env.COOKIE_SECURE,
    domain: env.COOKIE_DOMAIN,
    maxAge: env.ACCESS_TOKEN_TTL * 1000,
  });
}

function clearAuthCookies(res: Response) {
  const options = {
    domain: env.COOKIE_DOMAIN,
    httpOnly: true,
    sameSite: "lax" as const,
    secure: env.COOKIE_SECURE,
  };
  res.clearCookie(env.REFRESH_COOKIE_NAME, options);
  res.clearCookie(env.ACCESS_COOKIE_NAME, options);
}

function extractClientIp(req: Request): string | null {
  const forwarded = (req.headers["x-forwarded-for"] as string | undefined)?.split(",")[0]?.trim();
  const ip = forwarded || req.ip;
  return ip ?? null;
}

function bearerToken(header?: string): string | null {
  if (!header || typeof header !== "string") {
    return null;
  }
  const [scheme, value] = header.split(" ");
  if (!value || scheme.toLowerCase() !== "bearer") {
    return null;
  }
  return value;
}

function currentSessionId(req: Request): string | null {
  const token =
    (req.cookies?.[env.ACCESS_COOKIE_NAME] as string | undefined) ??
    bearerToken(req.headers.authorization ?? undefined);
  if (!token) {
    return null;
  }
  try {
    const decoded = verifyAccess(token);
    return typeof decoded.sid === "string" ? decoded.sid : null;
  } catch {
    return null;
  }
}

function buildAuthContext(req: Request, res: Response): LoginContext {
  return {
    userAgent: req.get("user-agent") ?? null,
    ip: extractClientIp(req),
    requestId: req.requestId ?? res.locals.requestId ?? null,
  };
}

function getAuthenticatedUser(req: Request): { sub?: string; sid?: string; role?: string } | null {
  return req.user ?? null;
}

type RegisterInput = z.infer<typeof RegisterSchema>;
type LoginInput = z.infer<typeof LoginSchema>;
type ForgotPasswordInput = z.infer<typeof ForgotPasswordSchema>;
type ResetPasswordInput = z.infer<typeof ResetPasswordSchema>;

export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const payload: RegisterInput = RegisterSchema.parse(req.body);
    const { verificationToken } = await doRegister(payload);

    const response: Record<string, unknown> = {
      message: "If the email is valid, a verification link will be sent shortly.",
    };
    if (!env.isProduction && verificationToken) {
      response.debugVerificationToken = verificationToken;
      response.verificationUrl = `${env.appBaseUrl}/auth/verify?token=${verificationToken}`;
    }
    return res.status(202).json(response);
  } catch (error) {
    next(error);
  }
}

export async function verifyEmail(req: Request, res: Response, next: NextFunction) {
  try {
    const queryToken = typeof req.query.token === "string" ? req.query.token : undefined;
    const bodyToken =
      req.body && typeof req.body === "object" && "token" in req.body
        ? (req.body as Record<string, unknown>).token
        : undefined;
    const token = typeof bodyToken === "string" ? bodyToken : queryToken;
    if (!token) {
      throw new HttpError(400, "AUTH_INVALID_TOKEN", "Verification token is required");
    }
    const user = await doVerifyEmail(token);
    return res.json({ user });
  } catch (error) {
    next(error);
  }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const credentials: LoginInput = LoginSchema.parse(req.body);
    const context = buildAuthContext(req, res);
    const { user, tokens, session } = await doLogin(credentials, context);
    setAccessCookie(res, tokens.accessToken);
    setRefreshCookie(res, tokens.refreshToken);
    return res.json({ user, session });
  } catch (error) {
    next(error);
  }
}

export async function refresh(req: Request, res: Response, next: NextFunction) {
  try {
    const token = req.cookies?.[env.REFRESH_COOKIE_NAME] as string | undefined;
    if (!token) {
      throw new HttpError(401, "UNAUTHENTICATED", "Missing refresh token");
    }
    const context = buildAuthContext(req, res);
    const { user, newRefresh, accessToken } = await doRefresh(token, context);
    setRefreshCookie(res, newRefresh);
    setAccessCookie(res, accessToken);
    return res.json({ user });
  } catch (error) {
    next(error);
  }
}

export async function logout(req: Request, res: Response, next: NextFunction) {
  try {
    const token = req.cookies?.[env.REFRESH_COOKIE_NAME] as string | undefined;
    const context = buildAuthContext(req, res);
    await doLogout(token, context);
    clearAuthCookies(res);
    return res.status(204).send();
  } catch (error) {
    next(error);
  }
}

export async function forgotPassword(req: Request, res: Response, next: NextFunction) {
  try {
    const payload: ForgotPasswordInput = ForgotPasswordSchema.parse(req.body);
    const { resetToken } = await requestPasswordReset(payload.email);
    const response: Record<string, unknown> = {
      message: "If the email is registered, a reset link will be sent shortly.",
    };
    if (!env.isProduction && resetToken) {
      response.debugResetToken = resetToken;
      response.resetUrl = `${env.appBaseUrl}/auth/password/reset?token=${resetToken}`;
    }
    return res.status(202).json(response);
  } catch (error) {
    next(error);
  }
}

export async function resetPassword(req: Request, res: Response, next: NextFunction) {
  try {
    const payload: ResetPasswordInput = ResetPasswordSchema.parse(req.body);
    await doResetPassword(payload.token, payload.newPassword);
    clearAuthCookies(res);
    return res.status(204).send();
  } catch (error) {
    next(error);
  }
}

export async function listSessions(req: Request, res: Response, next: NextFunction) {
  try {
    const authUser = getAuthenticatedUser(req);
    const userId = authUser?.sub;
    if (!userId) {
      throw new HttpError(401, "UNAUTHENTICATED", "Missing authentication context");
    }
    const sessionId = authUser?.sid ?? currentSessionId(req);
    const sessions = await doListSessions(userId, sessionId ?? null);
    return res.json({ sessions });
  } catch (error) {
    next(error);
  }
}

export async function revokeSessions(req: Request, res: Response, next: NextFunction) {
  try {
    const authUser = getAuthenticatedUser(req);
    const userId = authUser?.sub;
    if (!userId) {
      throw new HttpError(401, "UNAUTHENTICATED", "Missing authentication context");
    }
    const payload = RevokeSessionsSchema.parse(req.body ?? {});
    const sessionId = authUser?.sid ?? currentSessionId(req);
    if (payload.revokeOthers && !sessionId) {
      throw new HttpError(
        400,
        "AUTH_SESSION_UNKNOWN",
        "Current session is required to revoke others",
      );
    }
    const context = buildAuthContext(req, res);
    const result = await doRevokeSessions(userId, {
      sessionId: payload.sessionId ?? undefined,
      revokeAll: payload.revokeAll ?? false,
      revokeOthers: payload.revokeOthers ?? false,
      currentSessionId: sessionId,
      context,
    });

    const revokingCurrent =
      Boolean(payload.revokeAll) || (payload.sessionId ? payload.sessionId === sessionId : false);

    if (revokingCurrent || payload.revokeAll) {
      clearAuthCookies(res);
      return res.status(204).send();
    }

    return res.json({ revoked: result.revoked });
  } catch (error) {
    next(error);
  }
}

export function jwksHandler(_req: Request, res: Response) {
  res.json(JWKS);
}
