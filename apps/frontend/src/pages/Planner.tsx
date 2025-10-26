import React from "react";
import PageIntro from "../components/PageIntro";

const Planner: React.FC = () => (
  <PageIntro
    eyebrow="Session Architecture"
    title="Design training blocks with intent."
    description="Drag, duplicate, and periodise workouts. Planner keeps intensity, volume, and deload ratios aligned with your macrocycle."
  >
    <div
      style={{
        display: "grid",
        gap: "1rem",
        background: "rgba(15, 23, 42, 0.5)",
        borderRadius: "18px",
        padding: "1.5rem",
        border: "1px solid rgba(148, 163, 184, 0.18)",
      }}
    >
      {["Week 1 · Foundation", "Week 2 · Volume", "Week 3 · Intensity"].map((block) => (
        <div
          key={block}
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "1rem 1.25rem",
            borderRadius: "16px",
            background: "rgba(15, 23, 42, 0.35)",
            border: "1px solid rgba(148, 163, 184, 0.15)",
          }}
        >
          <div style={{ display: "grid", gap: "0.35rem" }}>
            <strong style={{ fontSize: "1.05rem" }}>{block}</strong>
            <span style={{ color: "var(--color-text-secondary)", fontSize: "0.9rem" }}>
              Pull heavy, push moderate, accessories focused on posture.
            </span>
          </div>
          <button
            type="button"
            style={{
              borderRadius: "12px",
              padding: "0.5rem 0.9rem",
              background: "rgba(52, 211, 153, 0.16)",
              color: "var(--color-accent)",
              fontWeight: 600,
            }}
          >
            Edit block
          </button>
        </div>
      ))}
    </div>
  </PageIntro>
);

export default Planner;
