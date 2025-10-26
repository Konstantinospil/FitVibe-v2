import type { Request, Response } from "express";
import { z } from "zod";
import {
  buildProgressReport,
  getExerciseBreakdown,
  getPlans,
  getSummary,
  getTrends,
  renderProgressReportCsv,
} from "./progress.service";

const periodEnum = z.enum(["7", "30", "90"]).transform((v) => parseInt(v, 10));
const groupByEnum = z.enum(["day", "week"]);

function requireUserId(req: Request, res: Response): string | null {
  const userId = req.user?.sub;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return null;
  }
  return userId;
}

export async function summaryHandler(req: Request, res: Response) {
  const parsed = z.object({ period: periodEnum.default("30") }).safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const userId = requireUserId(req, res);
  if (!userId) {
    return;
  }
  const result = await getSummary(userId, parsed.data.period);
  res.json(result);
}

export async function trendsHandler(req: Request, res: Response) {
  const parsed = z
    .object({
      period: periodEnum.default("30"),
      group_by: groupByEnum.default("day"),
    })
    .safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const userId = requireUserId(req, res);
  if (!userId) {
    return;
  }
  const result = await getTrends(userId, parsed.data.period, parsed.data.group_by);
  res.json(result);
}

export async function exercisesHandler(req: Request, res: Response) {
  const parsed = z.object({ period: periodEnum.default("90") }).safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const userId = requireUserId(req, res);
  if (!userId) {
    return;
  }
  const result = await getExerciseBreakdown(userId, parsed.data.period);
  res.json(result);
}

export async function plansHandler(req: Request, res: Response) {
  const userId = requireUserId(req, res);
  if (!userId) {
    return;
  }
  const result = await getPlans(userId);
  res.json(result);
}

const exportParams = z
  .object({
    format: z.enum(["json", "csv"]).default("json"),
    period: periodEnum.default("30"),
    group_by: groupByEnum.default("week"),
  })
  .strict();

export async function exportHandler(req: Request, res: Response) {
  const parsed = exportParams.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const userId = requireUserId(req, res);
  if (!userId) {
    return;
  }

  const { period, group_by: groupBy, format } = parsed.data;
  const report = await buildProgressReport(userId, period, groupBy);

  if (format === "csv") {
    const csv = renderProgressReportCsv(report);
    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=\"progress-report-${period}d-${groupBy}.csv\"`,
    );
    res.send(csv);
    return;
  }

  res.json(report);
}
