import React from "react";
import PageIntro from "../components/PageIntro";

const cardStyle: React.CSSProperties = {
  flex: "1 1 180px",
  minWidth: "180px",
  borderRadius: "18px",
  padding: "1.4rem",
  background: "rgba(15, 23, 42, 0.45)",
  border: "1px solid rgba(148, 163, 184, 0.22)",
  display: "grid",
  gap: "0.35rem",
};

const Dashboard: React.FC = () => (
  <PageIntro
    eyebrow="Readiness Pulse"
    title="Your training command center."
    description="Monitor streaks, readiness, and leaderboard deltas at a glance. Every metric updates in real-time once sessions sync from wearables or manual logs."
  >
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: "1rem",
      }}
    >
      <div style={cardStyle}>
        <span style={{ color: "var(--color-text-secondary)", fontSize: "0.85rem" }}>Streak</span>
        <strong style={{ fontSize: "2rem" }}>24 days</strong>
        <span style={{ fontSize: "0.9rem", color: "var(--color-accent)" }}>+3 vs last week</span>
      </div>
      <div style={cardStyle}>
        <span style={{ color: "var(--color-text-secondary)", fontSize: "0.85rem" }}>
          Recovery index
        </span>
        <strong style={{ fontSize: "2rem" }}>82%</strong>
        <span style={{ fontSize: "0.9rem", color: "#38bdf8" }}>Sleep + HRV trending up</span>
      </div>
      <div style={cardStyle}>
        <span style={{ color: "var(--color-text-secondary)", fontSize: "0.85rem" }}>
          Weekly volume
        </span>
        <strong style={{ fontSize: "2rem" }}>52.3k kg</strong>
        <span style={{ fontSize: "0.9rem", color: "#facc15" }}>Target: 60k kg</span>
      </div>
    </div>
  </PageIntro>
);

export default Dashboard;
