import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import PageIntro from "../components/PageIntro";
import { Button, Skeleton, VisibilityBadge } from "../components/ui";
import { Chart, type ChartDatum } from "../components/ui/Chart";
import ErrorBoundary from "../components/ErrorBoundary";
import DateRangePicker, { type DateRange } from "../components/DateRangePicker";
import { useDashboardAnalytics } from "../hooks/useDashboardAnalytics";
import {
  getProgressTrends,
  getExerciseBreakdown,
  exportProgress,
  type TrendDataPoint,
  type DashboardAggregateRow,
  type DashboardGrain,
  type DashboardPersonalRecord,
  type DashboardRange,
  type DashboardSummaryMetric,
} from "../services/api";

const DEFAULT_SUMMARY: DashboardSummaryMetric[] = [
  {
    id: "streak",
    label: "Training streak",
    value: "24 days",
    trend: "+3 vs last week",
  },
  {
    id: "readiness",
    label: "Recovery index",
    value: "82%",
    trend: "Sleep + HRV trending up",
  },
  {
    id: "volume",
    label: "Weekly volume",
    value: "52.3k kg",
    trend: "Target: 60k kg",
  },
];

const DEFAULT_RECORDS: DashboardPersonalRecord[] = [
  { lift: "Back squat", value: "180 kg", achieved: "6 weeks ago", visibility: "public" },
  { lift: "Bench press", value: "115 kg", achieved: "3 weeks ago", visibility: "public" },
  { lift: "Deadlift", value: "210 kg", achieved: "2 weeks ago", visibility: "public" },
];

const DEFAULT_AGGREGATES: Record<
  DashboardGrain,
  Record<DashboardRange, DashboardAggregateRow[]>
> = {
  weekly: {
    "4w": [
      { period: "Week 34", volume: 51250, sessions: 9 },
      { period: "Week 33", volume: 49840, sessions: 8 },
      { period: "Week 32", volume: 47210, sessions: 8 },
      { period: "Week 31", volume: 45500, sessions: 7 },
      { period: "Week 30", volume: 43980, sessions: 7 },
      { period: "Week 29", volume: 42870, sessions: 7 },
    ],
    "8w": [
      { period: "Week 34", volume: 51250, sessions: 9 },
      { period: "Week 33", volume: 49840, sessions: 8 },
      { period: "Week 32", volume: 47210, sessions: 8 },
      { period: "Week 31", volume: 45500, sessions: 7 },
      { period: "Week 30", volume: 43980, sessions: 7 },
      { period: "Week 29", volume: 42870, sessions: 7 },
      { period: "Week 28", volume: 41840, sessions: 6 },
      { period: "Week 27", volume: 40110, sessions: 6 },
    ],
  },
  monthly: {
    "4w": [
      { period: "August", volume: 206720, sessions: 33 },
      { period: "July", volume: 198340, sessions: 31 },
      { period: "June", volume: 189250, sessions: 30 },
      { period: "May", volume: 180410, sessions: 29 },
    ],
    "8w": [
      { period: "August", volume: 206720, sessions: 33 },
      { period: "July", volume: 198340, sessions: 31 },
      { period: "June", volume: 189250, sessions: 30 },
      { period: "May", volume: 180410, sessions: 29 },
      { period: "April", volume: 172890, sessions: 27 },
    ],
  },
};

const cardStyle: React.CSSProperties = {
  display: "grid",
  gap: "0.75rem",
  background: "var(--color-surface-glass)",
  borderRadius: "18px",
  padding: "1.6rem",
  border: "1px solid var(--color-border)",
};

const selectStyle: React.CSSProperties = {
  padding: "0.5rem 1rem",
  borderRadius: "8px",
  border: "1px solid var(--color-border)",
  background: "rgba(15, 23, 42, 0.5)",
  color: "var(--color-text-primary)",
  fontSize: "0.9rem",
  cursor: "pointer",
};

const toggleButtonStyle = (active: boolean): React.CSSProperties => ({
  padding: "0.5rem 1rem",
  borderRadius: "8px",
  border: `1px solid ${active ? "rgb(52, 211, 153)" : "var(--color-border)"}`,
  background: active ? "rgba(52, 211, 153, 0.15)" : "rgba(15, 23, 42, 0.5)",
  color: active ? "rgb(52, 211, 153)" : "var(--color-text-primary)",
  fontSize: "0.9rem",
  cursor: "pointer",
  fontWeight: active ? 600 : 400,
});

const formatMetricValue = (value: string | number) =>
  typeof value === "number" ? value.toLocaleString() : value;

const calculateDateRange = (period: number): DateRange => {
  const to = new Date().toISOString().split("T")[0];
  const from = new Date(Date.now() - period * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
  return { from, to };
};

const Insights: React.FC = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<"dashboard" | "progress">("dashboard");

  // Dashboard state
  const [dashboardRange, setDashboardRange] = useState<DashboardRange>("4w");
  const [grain, setGrain] = useState<DashboardGrain>("weekly");
  const { data, isLoading, isFetching, error, refetch } = useDashboardAnalytics({
    range: dashboardRange,
    grain,
  });

  // Progress state
  const [rangeMode, setRangeMode] = useState<"preset" | "custom">("preset");
  const [period, setPeriod] = useState<number>(30);
  const [customRange, setCustomRange] = useState<DateRange>(calculateDateRange(30));
  const [groupBy, setGroupBy] = useState<"day" | "week">("week");
  const [isExporting, setIsExporting] = useState(false);

  // Compute effective date range for Progress tab
  const effectiveDateRange = useMemo(() => {
    if (rangeMode === "custom") {
      return customRange;
    }
    return calculateDateRange(period);
  }, [rangeMode, period, customRange]);

  // Dashboard data
  const rangeLabels: Record<DashboardRange, string> = {
    "4w": t("dashboard.last4Weeks"),
    "8w": t("dashboard.last8Weeks"),
  };

  const grainLabels: Record<DashboardGrain, string> = {
    weekly: t("dashboard.weekly"),
    monthly: t("dashboard.monthly"),
  };

  const summaryMetrics = data?.summary?.length ? data.summary : DEFAULT_SUMMARY;
  const personalRecords = data?.personalRecords?.length ? data.personalRecords : DEFAULT_RECORDS;
  const fallbackAggregates = useMemo(
    () => DEFAULT_AGGREGATES[grain]?.[dashboardRange] ?? [],
    [grain, dashboardRange],
  );
  const aggregateRows = data?.aggregates?.length ? data.aggregates : fallbackAggregates;
  const activeRange = data?.meta?.range ?? dashboardRange;
  const activeGrain = data?.meta?.grain ?? grain;

  // Progress queries
  const {
    data: trendsData,
    isLoading: trendsLoading,
    error: trendsError,
    refetch: refetchTrends,
  } = useQuery({
    queryKey: ["progress-trends", effectiveDateRange, groupBy],
    queryFn: () =>
      getProgressTrends({
        from: effectiveDateRange.from,
        to: effectiveDateRange.to,
        group_by: groupBy,
      }),
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
    staleTime: 60000,
    enabled: activeTab === "progress",
  });

  const {
    data: exerciseData,
    isLoading: exercisesLoading,
    error: exercisesError,
    refetch: refetchExercises,
  } = useQuery({
    queryKey: ["exercise-breakdown", effectiveDateRange],
    queryFn: () =>
      getExerciseBreakdown({
        from: effectiveDateRange.from,
        to: effectiveDateRange.to,
      }),
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
    staleTime: 60000,
    enabled: activeTab === "progress",
  });

  const handleExport = async () => {
    try {
      setIsExporting(true);
      const blob = await exportProgress();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `fitvibe-progress-${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Export failed:", error);
      alert(t("progress.exportError") || t("progress.exportFailed"));
    } finally {
      setIsExporting(false);
    }
  };

  // Transform trends data for charts
  const volumeChartData: ChartDatum[] = useMemo(
    () =>
      trendsData?.map((point: TrendDataPoint) => ({
        label: point.label,
        value: Math.round(point.volume / 1000),
      })) || [],
    [trendsData],
  );

  const sessionsChartData: ChartDatum[] = useMemo(
    () =>
      trendsData?.map((point: TrendDataPoint) => ({
        label: point.label,
        value: point.sessions,
      })) || [],
    [trendsData],
  );

  const intensityChartData: ChartDatum[] = useMemo(
    () =>
      trendsData?.map((point: TrendDataPoint) => ({
        label: point.label,
        value: Math.round(point.avgIntensity * 10) / 10,
      })) || [],
    [trendsData],
  );

  const chartErrorFallback = (chartName: string) => (
    <div
      style={{
        padding: "2rem",
        textAlign: "center",
        color: "var(--color-text-secondary)",
        background: "rgba(248, 113, 113, 0.1)",
        borderRadius: "12px",
        border: "1px solid rgba(248, 113, 113, 0.3)",
      }}
    >
      <p style={{ margin: 0, marginBottom: "1rem" }}>
        {t("progress.chartError") || `Failed to render ${chartName} chart`}
      </p>
      <Button type="button" size="sm" variant="secondary" onClick={() => window.location.reload()}>
        {t("progress.reload") || t("progress.reloadPage")}
      </Button>
    </div>
  );

  return (
    <PageIntro
      eyebrow={t("insights.eyebrow")}
      title={t("insights.title")}
      description={t("insights.description")}
    >
      {/* Tab Navigation */}
      <div
        style={{
          display: "flex",
          gap: "0.5rem",
          marginBottom: "1.5rem",
          borderBottom: "1px solid var(--color-border)",
          paddingBottom: "0.5rem",
        }}
      >
        <button
          type="button"
          onClick={() => setActiveTab("dashboard")}
          style={{
            padding: "0.75rem 1.5rem",
            borderRadius: "8px 8px 0 0",
            background: activeTab === "dashboard" ? "var(--color-accent)" : "transparent",
            color: activeTab === "dashboard" ? "#0f172a" : "var(--color-text-secondary)",
            fontWeight: activeTab === "dashboard" ? 600 : 500,
            border: "none",
            cursor: "pointer",
            transition: "all 150ms ease",
          }}
        >
          {t("insights.dashboardTab")}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("progress")}
          style={{
            padding: "0.75rem 1.5rem",
            borderRadius: "8px 8px 0 0",
            background: activeTab === "progress" ? "var(--color-accent)" : "transparent",
            color: activeTab === "progress" ? "#0f172a" : "var(--color-text-secondary)",
            fontWeight: activeTab === "progress" ? 600 : 500,
            border: "none",
            cursor: "pointer",
            transition: "all 150ms ease",
          }}
        >
          {t("insights.progressTab")}
        </button>
      </div>

      {/* Dashboard Tab Content */}
      {activeTab === "dashboard" && (
        <section style={{ display: "grid", gap: "1.5rem" }}>
          {error ? (
            <div
              role="alert"
              style={{
                padding: "0.85rem 1rem",
                borderRadius: "12px",
                border: "1px solid rgba(235, 87, 87, 0.35)",
                background: "rgba(235, 87, 87, 0.12)",
                color: "rgb(248, 113, 113)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "1rem",
                flexWrap: "wrap",
              }}
            >
              <span>We could not refresh analytics right now. Showing the last loaded snapshot.</span>
              <Button size="sm" variant="ghost" type="button" onClick={() => void refetch()}>
                Retry
              </Button>
            </div>
          ) : null}

          <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem" }}>
            {summaryMetrics.map((metric) => (
              <div
                key={metric.id}
                style={{
                  flex: "1 1 200px",
                  minWidth: "200px",
                  background: "var(--color-surface-glass)",
                  borderRadius: "18px",
                  padding: "1.4rem",
                  border: "1px solid var(--color-border)",
                  display: "grid",
                  gap: "0.35rem",
                }}
              >
                <span style={{ color: "var(--color-text-secondary)", fontSize: "0.85rem" }}>
                  {metric.label}
                </span>
                {isLoading ? (
                  <Skeleton height="2rem" />
                ) : (
                  <strong style={{ fontSize: "2rem" }}>{formatMetricValue(metric.value)}</strong>
                )}
                {metric.trend ? (
                  <span style={{ fontSize: "0.9rem", color: "var(--color-highlight)" }}>
                    {metric.trend}
                  </span>
                ) : null}
              </div>
            ))}
          </div>

          <div style={cardStyle}>
            <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <strong style={{ fontSize: "1.1rem" }}>Personal bests</strong>
              <VisibilityBadge level="public" />
            </header>
            <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "grid", gap: "0.6rem" }}>
              {personalRecords.map((entry) => (
                <li key={`${entry.lift}-${entry.value}`} style={{ display: "grid", gap: "0.2rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span>{entry.lift}</span>
                    <strong>{entry.value}</strong>
                  </div>
                  <small style={{ color: "var(--color-text-muted)" }}>{entry.achieved}</small>
                </li>
              ))}
            </ul>
          </div>

          <div style={cardStyle}>
            <header
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "0.75rem",
              }}
            >
              <strong style={{ fontSize: "1.1rem" }}>Volume aggregates</strong>
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                <select
                  aria-label={t("dashboard.selectRange")}
                  value={dashboardRange}
                  onChange={(event) => setDashboardRange(event.target.value as DashboardRange)}
                  style={{
                    background: "rgba(15, 23, 42, 0.35)",
                    color: "var(--color-text-primary)",
                    border: "1px solid var(--color-border)",
                    borderRadius: "12px",
                    padding: "0.35rem 0.75rem",
                  }}
                >
                  <option value="4w">Last 4 weeks</option>
                  <option value="8w">Last 8 weeks</option>
                </select>
                <div style={{ display: "inline-flex", gap: "0.35rem" }}>
                  {(
                    [
                      { key: "weekly", label: t("dashboard.weekly") },
                      { key: "monthly", label: t("dashboard.monthly") },
                    ] as const
                  ).map((option) => (
                    <Button
                      key={option.key}
                      type="button"
                      size="sm"
                      variant={grain === option.key ? "primary" : "secondary"}
                      onClick={() => setGrain(option.key)}
                    >
                      {option.label}
                    </Button>
                  ))}
                </div>
              </div>
            </header>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "0.6rem",
                color: "var(--color-text-muted)",
                fontSize: "0.85rem",
              }}
            >
              <span aria-live="polite">
                Range: {rangeLabels[activeRange]} • Grain: {grainLabels[activeGrain]}
              </span>
              {isFetching && !isLoading ? <span>Refreshing…</span> : null}
            </div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
                <thead>
                  <tr style={{ textAlign: "left", color: "var(--color-text-secondary)" }}>
                    <th style={{ paddingBottom: "0.5rem" }}>Period</th>
                    <th style={{ paddingBottom: "0.5rem" }}>Volume</th>
                    <th style={{ paddingBottom: "0.5rem" }}>Sessions</th>
                  </tr>
                </thead>
                <tbody>
                  {aggregateRows.map((row) => (
                    <tr key={`${row.period}-${row.volume}`}>
                      <td style={{ padding: "0.4rem 0" }}>{row.period}</td>
                      <td style={{ padding: "0.4rem 0" }}>{row.volume.toLocaleString()} kg</td>
                      <td style={{ padding: "0.4rem 0" }}>{row.sessions}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <small style={{ color: "var(--color-text-muted)" }}>
              Showing up to 5 periods to keep payloads light on shared dashboards.
            </small>
          </div>
        </section>
      )}

      {/* Progress Tab Content */}
      {activeTab === "progress" && (
        <div style={{ display: "grid", gap: "1.5rem" }}>
          {/* Controls */}
          <div style={{ display: "grid", gap: "1rem" }}>
            {/* Range Mode Toggle */}
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button
                type="button"
                style={toggleButtonStyle(rangeMode === "preset")}
                onClick={() => setRangeMode("preset")}
              >
                {t("progress.presetRange") || t("progress.presetRange")}
              </button>
              <button
                type="button"
                style={toggleButtonStyle(rangeMode === "custom")}
                onClick={() => setRangeMode("custom")}
              >
                {t("progress.customRange") || t("progress.customRange")}
              </button>
            </div>

            {/* Controls Row */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "1rem",
              }}
            >
              <div style={{ display: "flex", gap: "1rem", alignItems: "center", flexWrap: "wrap" }}>
                {rangeMode === "preset" ? (
                  <label style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                    <span style={{ fontSize: "0.9rem", color: "var(--color-text-secondary)" }}>
                      {t("progress.period") || "Period"}:
                    </span>
                    <select
                      style={selectStyle}
                      value={period}
                      onChange={(e) => setPeriod(Number(e.target.value))}
                    >
                      <option value={7}>{t("progress.7days") || t("progress.7days")}</option>
                      <option value={30}>{t("progress.30days") || t("progress.30days")}</option>
                      <option value={90}>{t("progress.90days") || t("progress.90days")}</option>
                    </select>
                  </label>
                ) : (
                  <DateRangePicker value={customRange} onChange={setCustomRange} />
                )}
                <label style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                  <span style={{ fontSize: "0.9rem", color: "var(--color-text-secondary)" }}>
                    {t("progress.groupBy") || "Group by"}:
                  </span>
                  <select
                    style={selectStyle}
                    value={groupBy}
                    onChange={(e) => setGroupBy(e.target.value as "day" | "week")}
                  >
                    <option value="day">{t("progress.daily") || t("progress.daily")}</option>
                    <option value="week">{t("progress.weekly") || "Weekly"}</option>
                  </select>
                </label>
              </div>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => void handleExport()}
                isLoading={isExporting}
                disabled={isExporting}
              >
                {t("progress.export") || t("progress.exportCsv")}
              </Button>
            </div>
          </div>

          {/* Volume Trend Chart */}
          <section style={cardStyle}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <strong style={{ fontSize: "1.05rem" }}>
                {t("progress.volumeTrend") || t("progress.volumeTrend")}
              </strong>
              <span style={{ color: "var(--color-text-secondary)", fontSize: "0.9rem" }}>
                {effectiveDateRange.from} → {effectiveDateRange.to}
              </span>
            </div>
            {trendsLoading ? (
              <Skeleton width="100%" height="240px" />
            ) : trendsError ? (
              <div
                style={{
                  padding: "2rem",
                  textAlign: "center",
                  color: "var(--color-text-secondary)",
                  background: "rgba(248, 113, 113, 0.1)",
                  borderRadius: "12px",
                  border: "1px solid rgba(248, 113, 113, 0.3)",
                }}
              >
                <p style={{ margin: 0, marginBottom: "1rem" }}>
                  {t("progress.loadError") || t("progress.failedToLoad")}
                </p>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={() => void refetchTrends()}
                >
                  {t("progress.retry") || t("progress.retry")}
                </Button>
              </div>
            ) : volumeChartData.length > 0 ? (
              <ErrorBoundary fallback={chartErrorFallback(t("progress.volumeTrend"))}>
                <Chart
                  data={volumeChartData}
                  type="area"
                  height={240}
                  color="rgba(52, 211, 153, 1)"
                  valueFormatter={(value) => `${value}k kg`}
                />
              </ErrorBoundary>
            ) : (
              <div
                style={{
                  height: "240px",
                  display: "grid",
                  placeItems: "center",
                  color: "var(--color-text-muted)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "12px",
                }}
              >
                {t("progress.noData") || t("progress.noData")}
              </div>
            )}
          </section>

          {/* Sessions Trend Chart */}
          <section style={cardStyle}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <strong style={{ fontSize: "1.05rem" }}>
                {t("progress.sessionsTrend") || t("progress.sessionsTrend")}
              </strong>
            </div>
            {trendsLoading ? (
              <Skeleton width="100%" height="240px" />
            ) : trendsError ? (
              <div
                style={{
                  padding: "2rem",
                  textAlign: "center",
                  color: "var(--color-text-secondary)",
                  background: "rgba(248, 113, 113, 0.1)",
                  borderRadius: "12px",
                  border: "1px solid rgba(248, 113, 113, 0.3)",
                }}
              >
                <p style={{ margin: 0, marginBottom: "1rem" }}>
                  {t("progress.loadError") || t("progress.failedToLoad")}
                </p>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={() => void refetchTrends()}
                >
                  {t("progress.retry") || t("progress.retry")}
                </Button>
              </div>
            ) : sessionsChartData.length > 0 ? (
              <ErrorBoundary fallback={chartErrorFallback(t("progress.sessionsTrend"))}>
                <Chart
                  data={sessionsChartData}
                  type="bar"
                  height={240}
                  color="rgba(56, 189, 248, 1)"
                  valueFormatter={(value) => `${value} ${value === 1 ? "session" : "sessions"}`}
                />
              </ErrorBoundary>
            ) : (
              <div
                style={{
                  height: "240px",
                  display: "grid",
                  placeItems: "center",
                  color: "var(--color-text-muted)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "12px",
                }}
              >
                {t("progress.noData") || t("progress.noData")}
              </div>
            )}
          </section>

          {/* Average Intensity Trend Chart */}
          <section style={cardStyle}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <strong style={{ fontSize: "1.05rem" }}>
                {t("progress.intensityTrend") || t("progress.intensityTrend")}
              </strong>
            </div>
            {trendsLoading ? (
              <Skeleton width="100%" height="240px" />
            ) : trendsError ? (
              <div
                style={{
                  padding: "2rem",
                  textAlign: "center",
                  color: "var(--color-text-secondary)",
                  background: "rgba(248, 113, 113, 0.1)",
                  borderRadius: "12px",
                  border: "1px solid rgba(248, 113, 113, 0.3)",
                }}
              >
                <p style={{ margin: 0, marginBottom: "1rem" }}>
                  {t("progress.loadError") || t("progress.failedToLoad")}
                </p>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={() => void refetchTrends()}
                >
                  {t("progress.retry") || t("progress.retry")}
                </Button>
              </div>
            ) : intensityChartData.length > 0 ? (
              <ErrorBoundary fallback={chartErrorFallback("Intensity Trend")}>
                <Chart
                  data={intensityChartData}
                  type="area"
                  height={240}
                  color="rgba(251, 146, 60, 1)"
                  valueFormatter={(value) => `${value} RPE`}
                />
              </ErrorBoundary>
            ) : (
              <div
                style={{
                  height: "240px",
                  display: "grid",
                  placeItems: "center",
                  color: "var(--color-text-muted)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "12px",
                }}
              >
                {t("progress.noData") || t("progress.noData")}
              </div>
            )}
          </section>

          {/* Exercise Breakdown */}
          <section style={cardStyle}>
            <strong style={{ fontSize: "1.05rem" }}>
              {t("progress.exerciseBreakdown") || t("progress.exerciseBreakdown")}
            </strong>
            {exercisesLoading ? (
              <div style={{ display: "grid", gap: "0.75rem" }}>
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} width="100%" height="60px" />
                ))}
              </div>
            ) : exercisesError ? (
              <div
                style={{
                  padding: "2rem",
                  textAlign: "center",
                  color: "var(--color-text-secondary)",
                  background: "rgba(248, 113, 113, 0.1)",
                  borderRadius: "12px",
                  border: "1px solid rgba(248, 113, 113, 0.3)",
                }}
              >
                <p style={{ margin: 0, marginBottom: "1rem" }}>
                  {t("progress.loadError") || t("progress.failedToLoadExercise")}
                </p>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={() => void refetchExercises()}
                >
                  {t("progress.retry") || t("progress.retry")}
                </Button>
              </div>
            ) : exerciseData && exerciseData.exercises && exerciseData.exercises.length > 0 ? (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid var(--color-border)", textAlign: "left" }}>
                      <th style={{ padding: "0.75rem 0", color: "var(--color-text-secondary)" }}>
                        {t("progress.exercise") || "Exercise"}
                      </th>
                      <th style={{ padding: "0.75rem 0", color: "var(--color-text-secondary)" }}>
                        {t("progress.sessions") || "Sessions"}
                      </th>
                      <th style={{ padding: "0.75rem 0", color: "var(--color-text-secondary)" }}>
                        {t("progress.totalVolume") || t("progress.totalVolume")}
                      </th>
                      <th style={{ padding: "0.75rem 0", color: "var(--color-text-secondary)" }}>
                        {t("progress.avgVolume") || t("progress.avgVolume")}
                      </th>
                      <th style={{ padding: "0.75rem 0", color: "var(--color-text-secondary)" }}>
                        {t("progress.maxWeight") || t("progress.maxWeight")}
                      </th>
                      <th style={{ padding: "0.75rem 0", color: "var(--color-text-secondary)" }}>
                        {t("progress.trend") || t("progress.trend")}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {exerciseData.exercises.map((exercise) => (
                      <tr
                        key={exercise.exerciseId}
                        style={{ borderBottom: "1px solid rgba(148, 163, 184, 0.1)" }}
                      >
                        <td style={{ padding: "1rem 0" }}>
                          <strong>{exercise.exerciseName}</strong>
                        </td>
                        <td style={{ padding: "1rem 0" }}>{exercise.totalSessions}</td>
                        <td style={{ padding: "1rem 0" }}>
                          {(exercise.totalVolume / 1000).toFixed(1)}k kg
                        </td>
                        <td style={{ padding: "1rem 0" }}>
                          {(exercise.avgVolume / 1000).toFixed(1)}k kg
                        </td>
                        <td style={{ padding: "1rem 0" }}>{exercise.maxWeight} kg</td>
                        <td style={{ padding: "1rem 0" }}>
                          <span
                            style={{
                              color:
                                exercise.trend === "up"
                                  ? "rgb(52, 211, 153)"
                                  : exercise.trend === "down"
                                    ? "rgb(248, 113, 113)"
                                    : "var(--color-text-secondary)",
                            }}
                          >
                            {exercise.trend === "up"
                              ? t("progress.trendUp")
                              : exercise.trend === "down"
                                ? t("progress.trendDown")
                                : t("progress.trendStable")}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div
                style={{
                  padding: "2rem",
                  textAlign: "center",
                  color: "var(--color-text-muted)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "12px",
                }}
              >
                {t("progress.noExercises") || t("progress.noExerciseData")}
              </div>
            )}
          </section>
        </div>
      )}
    </PageIntro>
  );
};

export default Insights;
