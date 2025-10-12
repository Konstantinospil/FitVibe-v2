import { Request, Response, NextFunction } from "express";
import {
  register as doRegister,
  login as doLogin,
  refresh as doRefresh,
  logout as doLogout,
  verifyEmail as doVerifyEmail,
  requestPasswordReset,
  resetPassword as doResetPassword,
} from "./auth.service.js";
import { env, JWKS } from "../../config/env.js";
import {
  RegisterSchema,
  LoginSchema,
  ForgotPasswordSchema,
  ResetPasswordSchema,
} from "./auth.schemas.js";
import type { z } from "zod";
import { HttpError } from "../../utils/httpError.js";

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
    const token = (req.query.token || req.body.token) as string | undefined;
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
    const { user, tokens } = await doLogin(credentials);
    setAccessCookie(res, tokens.accessToken);
    setRefreshCookie(res, tokens.refreshToken);
    return res.json({ user });
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
    const { user, newRefresh, accessToken } = await doRefresh(token);
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
    await doLogout(token);
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

export function jwksHandler(_req: Request, res: Response) {
  res.json(JWKS);
}
