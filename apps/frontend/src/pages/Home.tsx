import React, { useEffect, useMemo, useState } from "react";
import { getHealthStatus } from "../services/api";
import { StatusPill } from "../components/StatusPill";

type HealthState = "checking" | "online" | "offline";

const Home: React.FC = () => {
  const [health, setHealth] = useState<HealthState>("checking");

  useEffect(() => {
    let mounted = true;

    const check = async () => {
      try {
        await getHealthStatus();
        if (mounted) setHealth("online");
      } catch {
        if (mounted) setHealth("offline");
      }
    };

    check();
    const interval = window.setInterval(check, 20_000);

    return () => {
      mounted = false;
      window.clearInterval(interval);
    };
  }, []);

  const subtitle = useMemo(() => {
    switch (health) {
      case "online":
        return "API connection looks healthy — ready when you are.";
      case "offline":
        return "We’ll keep everything cached locally until the backend returns.";
      default:
        return "Pinging the API and warming caches…";
    }
  }, [health]);

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
      <section
        style={{
          display: "grid",
          gap: "2.5rem",
          maxWidth: "880px",
          width: "100%",
          backgroundColor: "var(--color-bg-card)",
          borderRadius: "32px",
          padding: "3.5rem clamp(1.75rem, 5vw, 4rem)",
          boxShadow: "var(--shadow-elevated)",
          border: `1px solid var(--color-border)`,
          backdropFilter: "blur(12px)",
        }}
      >
        <header style={{ display: "grid", gap: "1rem" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.75rem",
              fontSize: "0.95rem",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              fontWeight: 600,
              color: "var(--color-text-secondary)",
            }}
            aria-label="Application status summary"
          >
            <span
              style={{
                width: "32px",
                height: "2px",
                background: "var(--color-accent)",
              }}
            />
            FitVibe Platform
          </div>
          <h1
            style={{
              fontSize: "clamp(2.4rem, 5vw, 3.6rem)",
              margin: 0,
              fontWeight: 700,
              letterSpacing: "-0.02em",
              lineHeight: 1.1,
            }}
          >
            Train smarter. Share progress. Celebrate consistency.
          </h1>
          <p
            style={{
              margin: 0,
              color: "var(--color-text-secondary)",
              fontSize: "1.1rem",
              lineHeight: 1.6,
            }}
          >
            FitVibe helps athletes and coaches plan, log, and analyse every session. A modern
            toolkit for streak tracking, leaderboard heatmaps, and meaningful recovery insights.
          </p>
        </header>

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
              color: "var(--color-text-secondary)",
              fontSize: "0.95rem",
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
          <a
            href="https://fitvibe.app"
            style={{
              padding: "0.9rem 1.6rem",
              borderRadius: "999px",
              background: "var(--color-accent)",
              color: "#0f172a",
              fontWeight: 600,
              letterSpacing: "0.02em",
              transition: "transform 200ms ease, box-shadow 200ms ease",
            }}
            onMouseEnter={(event) => {
              event.currentTarget.style.transform = "translateY(-3px)";
              event.currentTarget.style.boxShadow = "0 18px 40px -20px rgba(52, 211, 153, 0.8)";
            }}
            onFocus={(event) => {
              event.currentTarget.style.transform = "translateY(-3px)";
              event.currentTarget.style.boxShadow = "0 18px 40px -20px rgba(52, 211, 153, 0.8)";
            }}
            onMouseLeave={(event) => {
              event.currentTarget.style.transform = "none";
              event.currentTarget.style.boxShadow = "none";
            }}
            onBlur={(event) => {
              event.currentTarget.style.transform = "none";
              event.currentTarget.style.boxShadow = "none";
            }}
          >
            Join the private beta
          </a>
          <a
            href="mailto:engineering@fitvibe.app"
            style={{
              padding: "0.9rem 1.6rem",
              borderRadius: "999px",
              background: "var(--color-surface)",
              color: "var(--color-text-secondary)",
              fontWeight: 600,
              letterSpacing: "0.02em",
              border: `1px solid var(--color-border)`,
              backdropFilter: "blur(6px)",
            }}
            onMouseEnter={(event) => {
              event.currentTarget.style.transform = "translateY(-3px)";
              event.currentTarget.style.boxShadow = "0 18px 40px -20px rgba(15, 23, 42, 0.5)";
            }}
            onFocus={(event) => {
              event.currentTarget.style.transform = "translateY(-3px)";
              event.currentTarget.style.boxShadow = "0 18px 40px -20px rgba(15, 23, 42, 0.5)";
            }}
            onMouseLeave={(event) => {
              event.currentTarget.style.transform = "none";
              event.currentTarget.style.boxShadow = "none";
            }}
            onBlur={(event) => {
              event.currentTarget.style.transform = "none";
              event.currentTarget.style.boxShadow = "none";
            }}
          >
            Talk to the team
          </a>
        </div>
      </section>
    </main>
  );
};

export default Home;
