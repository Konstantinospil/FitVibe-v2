import { Router } from "express";

/**
 * Placeholder plans router until the feature is fully implemented.
 * Responds with HTTP 501 for all routes.
 */
export const plansRouter = Router();

plansRouter.use((_req, res) => {
  res
    .status(501)
    .json({ error: "PLANS_NOT_IMPLEMENTED", message: "Plans API is not available yet" });
});

export default plansRouter;
