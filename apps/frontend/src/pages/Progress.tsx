import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import PageIntro from "../components/PageIntro";
import { Chart, type ChartDatum } from "../components/ui/Chart";
import { Button, Skeleton } from "../components/ui";
import ErrorBoundary from "../components/ErrorBoundary";
import DateRangePicker, { type DateRange } from "../components/DateRangePicker";
import {
  getProgressTrends,
  getExerciseBreakdown,
  exportProgress,
  type TrendDataPoint,
} from "../services/api";

const cardStyle: React.CSSProperties = {
  display: "grid",
  gap: "1rem",
  background: "var(--color-surface-glass)}",
  borderRadius: "18px",
  padding: "1.75rem",
  border: "1px solid var(--color-border)}",
};

const selectStyle: React.CSSProperties = {
  padding: "0.5rem 1rem",
  borderRadius: "8px",
  border: "1px solid var(--color-border)}",
  background: "rgba(15, 23, 42, 0.5)}",
  color: "var(--color-text-primary)}",
  fontSize: "0.9rem",
  cursor: "pointer",
};

const toggleButtonStyle = (active: boolean): React.CSSProperties => ({
  padding: "0.5rem 1rem",
  borderRadius: "8px",
  border: `1px solid ${active ? "rgb(52, 211, 153)}" : "var(--color-border)}"}`,
  background: active ? "rgba(52, 211, 153, 0.15)}" : "rgba(15, 23, 42, 0.5)}",
  color: active ? "rgb(52, 211, 153)}" : "var(--color-text-primary)}",
  fontSize: "0.9rem",
  cursor: "pointer",
  fontWeight: active ? 600 : 400,
});

// Helper to calculate date range from period
const calculateDateRange = (period: number): DateRange => {
  const to = new Date().toISOString().split("T")[0];
  const from = new Date(Date.now() - period * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
  return { from, to };
};

const Progress: React.FC = () => {
  const { t } = useTranslation();
  const [rangeMode, setRangeMode] = useState<"preset" | "custom">("preset");
  const [period, setPeriod] = useState<number>(30);
  const [customRange, setCustomRange] = useState<DateRange>(calculateDateRange(30));
  const [groupBy, setGroupBy] = useState<"day" | "week">("week");
  const [isExporting, setIsExporting] = useState(false);

  // Compute effective date range based on mode
  const effectiveDateRange = useMemo(() => {
    if (rangeMode === "custom") {
      return customRange;
    }
    return calculateDateRange(period);
  }, [rangeMode, period, customRange]);

  // Queries with retry logic
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
    staleTime: 60000, // 1 minute
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
        value: Math.round(point.volume / 1000), // Convert to thousands
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
        value: Math.round(point.avgIntensity * 10) / 10, // Round to 1 decimal
      })) || [],
    [trendsData],
  );

  const chartErrorFallback = (chartName: string) => (
    <div
      style={{
        padding: "2rem",
        textAlign: "center",
        color: "var(--color-text-secondary)}",
        background: "rgba(248, 113, 113, 0.1)}",
        borderRadius: "12px",
        border: "1px solid rgba(248, 113, 113, 0.3)}",
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
      eyebrow={t("progress.eyebrow") || t("progress.eyebrow")}
      title={t("progress.title") || t("progress.title")}
      description={
        t("progress.description") ||
        t("progress.description")
      }
    >
      <div style={{ display: "grid", gap: "1.5rem" }}>
        {/* Controls */}
        <div
          style={{
            display: "grid",
            gap: "1rem",
          }}
        >
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
                  <span style={{ fontSize: "0.9rem", color: "var(--color-text-secondary)}" }}>
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
                <span style={{ fontSize: "0.9rem", color: "var(--color-text-secondary)}" }}>
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
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <strong style={{ fontSize: "1.05rem" }}>
              {t("progress.volumeTrend") || t("progress.volumeTrend")}
            </strong>
            <span style={{ color: "var(--color-text-secondary)}", fontSize: "0.9rem" }}>
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
                color: "var(--color-text-secondary)}",
                background: "rgba(248, 113, 113, 0.1)}",
                borderRadius: "12px",
                border: "1px solid rgba(248, 113, 113, 0.3)}",
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
                color="rgba(52, 211, 153, 1)}"
                valueFormatter={(value) => `${value}k kg`}
              />
            </ErrorBoundary>
          ) : (
            <div
              style={{
                height: "240px",
                display: "grid",
                placeItems: "center",
                color: "var(--color-text-muted)}",
                border: "1px solid var(--color-border)}",
                borderRadius: "12px",
              }}
            >
              {t("progress.noData") || t("progress.noData")}
            </div>
          )}
        </section>

        {/* Sessions Trend Chart */}
        <section style={cardStyle}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
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
                color: "var(--color-text-secondary)}",
                background: "rgba(248, 113, 113, 0.1)}",
                borderRadius: "12px",
                border: "1px solid rgba(248, 113, 113, 0.3)}",
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
                color="rgba(56, 189, 248, 1)}"
                valueFormatter={(value) => `${value} ${value === 1 ? "session" : "sessions"}`}
              />
            </ErrorBoundary>
          ) : (
            <div
              style={{
                height: "240px",
                display: "grid",
                placeItems: "center",
                color: "var(--color-text-muted)}",
                border: "1px solid var(--color-border)}",
                borderRadius: "12px",
              }}
            >
              {t("progress.noData") || t("progress.noData")}
            </div>
          )}
        </section>

        {/* Average Intensity Trend Chart */}
        <section style={cardStyle}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
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
                color: "var(--color-text-secondary)}",
                background: "rgba(248, 113, 113, 0.1)}",
                borderRadius: "12px",
                border: "1px solid rgba(248, 113, 113, 0.3)}",
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
                color="rgba(251, 146, 60, 1)}"
                valueFormatter={(value) => `${value} RPE`}
              />
            </ErrorBoundary>
          ) : (
            <div
              style={{
                height: "240px",
                display: "grid",
                placeItems: "center",
                color: "var(--color-text-muted)}",
                border: "1px solid var(--color-border)}",
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
                color: "var(--color-text-secondary)}",
                background: "rgba(248, 113, 113, 0.1)}",
                borderRadius: "12px",
                border: "1px solid rgba(248, 113, 113, 0.3)}",
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
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontSize: "0.9rem",
                }}
              >
                <thead>
                  <tr
                    style={{
                      borderBottom: "1px solid var(--color-border)}",
                      textAlign: "left",
                    }}
                  >
                    <th style={{ padding: "0.75rem 0", color: "var(--color-text-secondary)}" }}>
                      {t("progress.exercise") || "Exercise"}
                    </th>
                    <th style={{ padding: "0.75rem 0", color: "var(--color-text-secondary)}" }}>
                      {t("progress.sessions") || "Sessions"}
                    </th>
                    <th style={{ padding: "0.75rem 0", color: "var(--color-text-secondary)}" }}>
                      {t("progress.totalVolume") || t("progress.totalVolume")}
                    </th>
                    <th style={{ padding: "0.75rem 0", color: "var(--color-text-secondary)}" }}>
                      {t("progress.avgVolume") || t("progress.avgVolume")}
                    </th>
                    <th style={{ padding: "0.75rem 0", color: "var(--color-text-secondary)}" }}>
                      {t("progress.maxWeight") || t("progress.maxWeight")}
                    </th>
                    <th style={{ padding: "0.75rem 0", color: "var(--color-text-secondary)}" }}>
                      {t("progress.trend") || t("progress.trend")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {exerciseData.exercises.map((exercise) => (
                    <tr
                      key={exercise.exerciseId}
                      style={{ borderBottom: "1px solid rgba(148, 163, 184, 0.1)}" }}
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
                                ? "rgb(52, 211, 153)}"
                                : exercise.trend === "down"
                                  ? "rgb(248, 113, 113)}"
                                  : "var(--color-text-secondary)}",
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
                color: "var(--color-text-muted)}",
                border: "1px solid var(--color-border)}",
                borderRadius: "12px",
              }}
            >
              {t("progress.noExercises") || t("progress.noExerciseData")}
            </div>
          )}
        </section>
      </div>
    </PageIntro>
  );
};

export default Progress;
