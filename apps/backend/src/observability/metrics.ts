import type { NextFunction, Request, Response } from "express";
import client from "prom-client";

const register = new client.Registry();

client.collectDefaultMetrics({ register });

const httpRequestDuration = new client.Histogram({
  name: "http_request_duration_seconds",
  help: "Duration of HTTP requests in seconds",
  labelNames: ["method", "route", "status_code"],
  buckets: [0.05, 0.1, 0.2, 0.5, 1, 2, 5],
});

const httpRequestsTotal = new client.Counter({
  name: "http_requests_total",
  help: "Total number of HTTP requests",
  labelNames: ["method", "route", "status_code"],
});

const refreshReuseCounter = new client.Counter({
  name: "jwt_refresh_reuse_total",
  help: "Number of refresh token reuse incidents that triggered session family revocation",
});

const pointsAwardedCounter = new client.Counter({
  name: "points_awarded_total",
  help: "Total points awarded grouped by rule",
  labelNames: ["rule"],
});

register.registerMetric(httpRequestDuration);
register.registerMetric(httpRequestsTotal);
register.registerMetric(refreshReuseCounter);
register.registerMetric(pointsAwardedCounter);

function resolveRouteLabel(req: Request): string {
  const maybeRoute: unknown = req.route;
  if (maybeRoute && typeof maybeRoute === "object" && "path" in maybeRoute) {
    const routePath = (maybeRoute as { path?: unknown }).path;
    if (typeof routePath === "string" && routePath.length > 0) {
      return req.baseUrl ? `${req.baseUrl}${routePath}` : routePath;
    }
  }
  if (req.baseUrl) {
    return req.baseUrl;
  }
  return req.originalUrl.split("?")[0];
}

export function metricsMiddleware(req: Request, res: Response, next: NextFunction) {
  const endTimer = httpRequestDuration.startTimer({
    method: req.method,
    route: resolveRouteLabel(req),
  });

  res.on("finish", () => {
    const labels = {
      method: req.method,
      route: resolveRouteLabel(req),
      status_code: String(res.statusCode),
    };
    endTimer(labels);
    httpRequestsTotal.inc(labels);
  });

  next();
}

export async function metricsRoute(_req: Request, res: Response) {
  res.set("Content-Type", register.contentType);
  const metrics = await register.metrics();
  res.end(metrics);
}

export function incrementRefreshReuse() {
  refreshReuseCounter.inc();
}

export function incrementPointsAwarded(rule: string, amount: number) {
  pointsAwardedCounter.inc({ rule }, amount);
}
