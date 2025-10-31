import React, { Suspense, lazy, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { StatusPill } from "../components/StatusPill";
import { useHealthStatus } from "../hooks/useHealthStatus";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Skeleton,
  VisibilityBadge,
  type ChartDatum,
} from "../components/ui";

type HealthState = "checking" | "online" | "offline";

const LazyChart = lazy(() =>
  import("../components/ui/Chart").then((module) => ({ default: module.Chart })),
);

const Home: React.FC = () => {
  const { data, isLoading, isError, isFetching } = useHealthStatus();
  const { t } = useTranslation();

  const health: HealthState = useMemo(() => {
    if (isLoading) {
      return "checking";
    }
    if (isError) {
      return "offline";
    }
    return isFetching ? "checking" : "online";
  }, [isLoading, isError, isFetching]);

  const subtitle = useMemo(() => {
    switch (health) {
      case "online":
        return data ? t("home.subtitleOnline", { status: data }) : t("home.subtitleOnlineFallback");
      case "offline":
        return t("home.subtitleOffline");
      default:
        return t("home.subtitleChecking");
    }
  }, [health, data, t]);

  const consistencyTrend = useMemo<ChartDatum[]>(
    () => [
      { label: "Mon", value: 62 },
      { label: "Tue", value: 68 },
      { label: "Wed", value: 65 },
      { label: "Thu", value: 70 },
      { label: "Fri", value: 72 },
      { label: "Sat", value: 76 },
      { label: "Sun", value: 78 },
    ],
    [],
  );

  const handleBetaClick = () => {
    // Navigate to registration or show beta signup form
    window.location.href = "/register";
  };

  const handleContactClick = () => {
    // Open contact page or email link
    window.location.href = "mailto:team@fitvibe.app";
  };

  return (
    <main
      style={{
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "6rem 1.5rem",
      }}
    >
      <Card
        as="section"
        style={{
          display: "grid",
          gap: "0",
          maxWidth: "920px",
          width: "100%",
          padding: 0,
        }}
      >
        <CardHeader
          style={{
            display: "grid",
            gap: "1rem",
            padding: "3.5rem clamp(1.75rem, 5vw, 4rem) 2rem",
          }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.75rem",
              fontSize: "var(--font-size-sm)",
              letterSpacing: "var(--letter-spacing-wide)",
              textTransform: "uppercase",
              fontWeight: 600,
              color: "var(--color-text-muted)",
            }}
            aria-label={t("home.eyebrow")}
          >
            <span
              style={{
                width: "32px",
                height: "2px",
                background: "var(--color-accent)",
              }}
            />
            {t("home.eyebrow")}
          </div>
          <CardTitle
            style={{
              fontSize: "clamp(2.4rem, 5vw, 3.6rem)",
              margin: 0,
              lineHeight: "var(--line-height-tight)",
              letterSpacing: "var(--letter-spacing-tight)",
            }}
          >
            {t("home.title")}
          </CardTitle>
          <CardDescription style={{ fontSize: "var(--font-size-lg)" }}>
            {t("home.description")}
          </CardDescription>
        </CardHeader>

        <CardContent
          style={{
            gap: "2rem",
            padding: "0 3.5rem 3.5rem",
          }}
        >
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              gap: "1rem",
            }}
          >
            <StatusPill status={health} />
            <p
              style={{
                margin: 0,
                color: "var(--color-text-muted)",
                fontSize: "var(--font-size-sm)",
              }}
            >
              {subtitle}
            </p>
          </div>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "1rem",
            }}
          >
            <Button type="button" onClick={handleBetaClick}>
              {t("home.ctaPrimary")}
            </Button>
            <Button type="button" variant="secondary" onClick={handleContactClick}>
              {t("home.ctaSecondary")}
            </Button>
          </div>

          <Card
            style={{
              gap: "0",
              padding: 0,
              background: "var(--color-surface-glass)",
              border: "1px solid var(--color-border-strong)",
              boxShadow: "none",
            }}
          >
            <CardHeader
              style={{
                padding: "2rem 2.5rem 1.25rem",
                gap: "0.75rem",
                borderBottom: "1px solid rgba(148, 163, 184, 0.12)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "1rem",
                  flexWrap: "wrap",
                }}
              >
                <CardTitle style={{ fontSize: "var(--font-size-xl)" }}>
                  {t("home.chartTitle")}
                </CardTitle>
                <VisibilityBadge level="private" />
              </div>
              <CardDescription>{t("home.chartDescription")}</CardDescription>
            </CardHeader>
            <CardContent style={{ padding: "1.5rem 2.5rem 2.25rem" }}>
              <Suspense fallback={<Skeleton height="220px" radius="24px" />}>
                <LazyChart
                  data={consistencyTrend}
                  valueFormatter={(value) => t("home.chartValue", { value })}
                  labelFormatter={(label) => t("home.chartLabel", { label })}
                />
              </Suspense>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </main>
  );
};

export default Home;
