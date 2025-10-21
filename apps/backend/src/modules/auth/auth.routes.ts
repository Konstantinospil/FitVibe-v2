import { Router } from "express";
import {
  register,
  login,
  refresh,
  logout,
  verifyEmail,
  forgotPassword,
  resetPassword,
  listSessions,
  revokeSessions,
  jwksHandler,
} from "./auth.controller.js";
import { rateLimit } from "../common/rateLimiter.js";
import { validate } from "../../utils/validation.js";
import {
  RegisterSchema,
  LoginSchema,
  ForgotPasswordSchema,
  ResetPasswordSchema,
  RevokeSessionsSchema,
} from "./auth.schemas.js";
import { requireAccessToken } from "./auth.middleware.js";
import { asyncHandler } from "../../utils/async-handler.js";

export const authRouter = Router();

authRouter.post(
  "/register",
  rateLimit("auth_register", 10, 60),
  validate(RegisterSchema),
  asyncHandler(register),
);
authRouter.get("/verify", rateLimit("auth_verify", 60, 60), asyncHandler(verifyEmail));
authRouter.post(
  "/login",
  rateLimit("auth_login", 10, 60),
  validate(LoginSchema),
  asyncHandler(login),
);
authRouter.post("/refresh", rateLimit("auth_refresh", 60, 60), asyncHandler(refresh));
authRouter.post("/logout", rateLimit("auth_logout", 60, 60), asyncHandler(logout));
authRouter.post(
  "/password/forgot",
  rateLimit("auth_pw_forgot", 5, 60),
  validate(ForgotPasswordSchema),
  asyncHandler(forgotPassword),
);
authRouter.post(
  "/password/reset",
  rateLimit("auth_pw_reset", 5, 60),
  validate(ResetPasswordSchema),
  asyncHandler(resetPassword),
);

authRouter.get(
  "/sessions",
  rateLimit("auth_sessions", 60, 60),
  requireAccessToken,
  asyncHandler(listSessions),
);
authRouter.post(
  "/sessions/revoke",
  rateLimit("auth_sessions_revoke", 10, 60),
  requireAccessToken,
  validate(RevokeSessionsSchema),
  asyncHandler(revokeSessions),
);

authRouter.get("/jwks", asyncHandler(jwksHandler));
