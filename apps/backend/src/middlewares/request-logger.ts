import type { Request, Response } from "express";
import morgan from "morgan";

import { env } from "../config/env.js";
import { logger } from "../config/logger.js";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

const stream: morgan.StreamOptions = {
  write: (message: string) => {
    const trimmed = message.trim();
    if (!trimmed) {
      return;
    }

    try {
      const parsed = JSON.parse(trimmed) as unknown;
      const payload = isRecord(parsed) ? parsed : { message: parsed, raw: parsed };
      logger.info(payload, "http_request");
    } catch {
      logger.info({ message: trimmed }, "http_request");
    }
  },
};

const skip: (req: Request, res: Response) => boolean = (req, _res) => {
  if (env.NODE_ENV === "test") {
    return true;
  }
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
