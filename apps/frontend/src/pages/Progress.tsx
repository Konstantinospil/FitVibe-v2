import React from "react";
import PageIntro from "../components/PageIntro";

const Progress: React.FC = () => (
  <PageIntro
    eyebrow="Trends & Insights"
    title="Visualise progression with context."
    description="Compare block-over-block volume, velocity, and readiness to understand how programming tweaks translate to platform results."
  >
    <div
      style={{
        display: "grid",
        gap: "1rem",
        background: "rgba(15, 23, 42, 0.45)",
        borderRadius: "18px",
        padding: "1.75rem",
        border: "1px solid rgba(148, 163, 184, 0.18)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <strong style={{ fontSize: "1.05rem" }}>Weekly Volume Trend</strong>
        <span style={{ color: "var(--color-text-secondary)", fontSize: "0.9rem" }}>
          Last 8 weeks
        </span>
      </div>
      <div
        style={{
          height: "160px",
          borderRadius: "14px",
          background:
            "linear-gradient(135deg, rgba(56, 189, 248, 0.25), rgba(52, 211, 153, 0.25))",
          border: "1px solid rgba(148, 163, 184, 0.12)",
          display: "grid",
          placeItems: "center",
          color: "var(--color-text-secondary)",
          fontSize: "0.95rem",
          letterSpacing: "0.03em",
        }}
      >
        Chart render placeholder
      </div>
      <div
        style={{
          display: "grid",
          gap: "0.8rem",
          color: "var(--color-text-secondary)",
          fontSize: "0.95rem",
        }}
      >
        <div>
          <strong style={{ color: "var(--color-text-primary)" }}>Peak week · 64.2k kg</strong>{" "}
          — achieved during high-intensity phase with deload scheduled next week.
        </div>
        <div>
          <strong style={{ color: "var(--color-text-primary)" }}>
            1RM projections up 3.4%
          </strong>{" "}
          compared to previous cycle, primarily driven by increased squat velocity.
        </div>
      </div>
    </div>
  </PageIntro>
);

export default Progress;
