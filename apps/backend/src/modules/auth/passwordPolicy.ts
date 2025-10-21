import { HttpError } from "../../utils/http.js";

export interface PasswordContext {
  email?: string;
  username?: string;
}

const COMPLEXITY_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\w\s]).{12,}$/;

export function assertPasswordPolicy(password: string, context?: PasswordContext) {
  if (!COMPLEXITY_REGEX.test(password)) {
    throw new HttpError(
      400,
      "AUTH_WEAK_PASSWORD",
      "Password must be at least 12 characters and include upper, lower, digit, and symbol",
    );
  }

  const lowered = password.toLowerCase();
  if (context?.username && lowered.includes(context.username.toLowerCase())) {
    throw new HttpError(400, "AUTH_PASSWORD_IDENTIFIER", "Password cannot contain your username");
  }
  if (context?.email) {
    const localPart = context.email.split("@")[0];
    if (localPart && lowered.includes(localPart.toLowerCase())) {
      throw new HttpError(
        400,
        "AUTH_PASSWORD_IDENTIFIER",
        "Password cannot contain your email address",
      );
    }
  }
}

export const PASSWORD_COMPLEXITY_REGEX = COMPLEXITY_REGEX;
