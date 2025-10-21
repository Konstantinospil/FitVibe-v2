import { Router } from "express";

/**
 * Placeholder logs router until audit log streaming is implemented.
 * Responds with HTTP 501 for all requests.
 */
export const logsRouter = Router();

logsRouter.use((_req, res) => {
  res.status(501).json({ error: "LOGS_NOT_IMPLEMENTED", message: "Logs API is not available yet" });
});

export default logsRouter;
