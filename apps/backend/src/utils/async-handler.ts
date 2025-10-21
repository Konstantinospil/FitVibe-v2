import type { NextFunction, Request, RequestHandler, Response } from "express";

type AsyncRouteHandler = (
  req: Request,
  res: Response,
  next: NextFunction,
) => void | Response | Promise<void | Response>;

/**
 * Wrap an async Express handler and funnel rejections to `next`.
 * Prevents @typescript-eslint/no-misused-promises violations and keeps
 * error handling consistent.
 */
export function asyncHandler(fn: AsyncRouteHandler): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    void Promise.resolve(fn(req, res, next)).catch(next);
  };
}
