import { Router } from "express";
import {
  register,
  login,
  refresh,
  logout,
  verifyEmail,
  forgotPassword,
  resetPassword,
  jwksHandler,
} from "./auth.controller.js";
import { rateLimit } from "../common/rateLimiter.js";
import { validate } from "../common/validation.js";
import {
  RegisterSchema,
  LoginSchema,
  ForgotPasswordSchema,
  ResetPasswordSchema,
} from "./auth.schemas.js";

export const authRouter = Router();

authRouter.post("/register", rateLimit("auth_register", 10, 60), validate(RegisterSchema), register);
authRouter.get("/verify", rateLimit("auth_verify", 60, 60), verifyEmail);
authRouter.post("/login", rateLimit("auth_login", 10, 60), validate(LoginSchema), login);
authRouter.post("/refresh", rateLimit("auth_refresh", 60, 60), refresh);
authRouter.post("/logout", rateLimit("auth_logout", 60, 60), logout);
authRouter.post(
  "/password/forgot",
  rateLimit("auth_pw_forgot", 5, 60),
  validate(ForgotPasswordSchema),
  forgotPassword,
);
authRouter.post(
  "/password/reset",
  rateLimit("auth_pw_reset", 5, 60),
  validate(ResetPasswordSchema),
  resetPassword,
);

authRouter.get("/jwks", jwksHandler);
