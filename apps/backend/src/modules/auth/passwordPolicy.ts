import { HttpError } from "../../utils/http.js";

export interface PasswordContext {
  email?: string;
  username?: string;
}

const COMPLEXITY_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\w\s]).{12,}$/;

export function assertPasswordPolicy(password: string, context?: PasswordContext) {
  if (!COMPLEXITY_REGEX.test(password)) {
    throw new HttpError(400, "WEAK_PASSWORD", "WEAK_PASSWORD");
  }

  const lowered = password.toLowerCase();
  if (context?.username && lowered.includes(context.username.toLowerCase())) {
    throw new HttpError(400, "PASSWORD_CONTAINS_USERNAME", "PASSWORD_CONTAINS_USERNAME");
  }
  if (context?.email) {
    const localPart = context.email.split("@")[0];
    if (localPart && lowered.includes(localPart.toLowerCase())) {
      throw new HttpError(400, "PASSWORD_CONTAINS_EMAIL", "PASSWORD_CONTAINS_EMAIL");
    }
  }
}

export const PASSWORD_COMPLEXITY_REGEX = COMPLEXITY_REGEX;
