import { z } from "zod";

export const passwordPolicy = z
  .string()
  .min(12, "Password must be at least 12 characters long")
  .max(128)
  .regex(/(?=.*[a-z])/, "Password must include a lowercase letter")
  .regex(/(?=.*[A-Z])/, "Password must include an uppercase letter")
  .regex(/(?=.*\d)/, "Password must include a digit")
  .regex(/(?=.*[^\w\s])/, "Password must include a symbol");

export const RegisterSchema = z.object({
  email: z.string().email(),
  username: z
    .string()
    .min(3)
    .max(50)
    .regex(/^[a-zA-Z0-9_\-.]+$/, "Username may only contain letters, numbers, underscores, dots, or dashes"),
  password: passwordPolicy,
  profile: z
    .object({
      display_name: z.string().min(1).max(100).optional(),
      sex: z.enum(["man", "woman", "diverse", "na"]).optional(),
      weight_kg: z.number().min(20).max(500).optional(),
      fitness_level: z.string().max(50).optional(),
      age: z.number().min(13).max(120).optional(),
    })
    .optional(),
});

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const ForgotPasswordSchema = z.object({
  email: z.string().email(),
});

export const ResetPasswordSchema = z.object({
  token: z.string().min(1),
  newPassword: passwordPolicy,
});

export const RevokeSessionsSchema = z
  .object({
    sessionId: z.string().uuid().optional(),
    revokeAll: z.boolean().optional(),
    revokeOthers: z.boolean().optional(),
  })
  .refine(
    (data) => Boolean(data.sessionId || data.revokeAll || data.revokeOthers),
    { message: "Provide sessionId or revoke scope", path: ["sessionId"] },
  )
  .refine(
    (data) => !(data.revokeAll && data.revokeOthers),
    { message: "Cannot combine revokeAll and revokeOthers", path: ["revokeAll"] },
  );
