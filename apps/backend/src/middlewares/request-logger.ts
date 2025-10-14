import type { Request } from "express";
import morgan from "morgan";

import { env } from "../config/env.js";
import { logger } from "../config/logger.js";

const stream: morgan.StreamOptions = {
  write: (message: string) => {
    const trimmed = message.trim();
    if (!trimmed) return;

    try {
      const payload = JSON.parse(trimmed);
      logger.info(payload, "http_request");
    } catch {
      logger.info({ message: trimmed }, "http_request");
    }
  },
};

const skip: morgan.SkipFunction = (req, _res) => {
  if (env.NODE_ENV === "test") return true;
  const route = req.originalUrl.split("?")[0];
  return route === "/health" || route === "/metrics";
};

morgan.token("id", (req: Request & { requestId?: string }) => req.requestId ?? "-");
morgan.token("route", (req: Request) => req.originalUrl.split("?")[0]);
morgan.token("user", (req: Request & { user?: { sub?: string } }) => req.user?.sub ?? "-");

const formatter: morgan.FormatFn = (tokens, req, res) => {
  const responseTime = tokens["response-time"](req, res);
  const contentLength = tokens.res(req, res, "content-length");

  return JSON.stringify({
    requestId: tokens.id(req, res),
    userId: tokens.user(req, res),
    method: tokens.method(req, res),
    route: tokens.route(req, res),
    status: tokens.status(req, res) ? Number(tokens.status(req, res)) : undefined,
    remoteAddress: tokens["remote-addr"](req, res),
    responseTimeMs: responseTime ? Number(responseTime) : undefined,
    contentLength: contentLength ? Number(contentLength) : undefined,
    userAgent: tokens.req(req, res, "user-agent"),
  });
};

export const httpLogger = morgan(formatter, {
  stream,
  skip,
});
