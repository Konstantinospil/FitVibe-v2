import { Request, Response, NextFunction } from "express";
import { ZodSchema } from "zod";
import { HttpError } from "./http.js";

/**
 * Validate request body/query/params using Zod schemas.
 */
export function validate(schema: ZodSchema<any>, target: "body" | "query" | "params" = "body") {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req[target]);
    if (!result.success) {
      throw new HttpError(400, "VALIDATION_ERROR", "Validation failed", result.error.flatten());
    }
    (req as any)[target] = result.data;
    next();
  };
}
