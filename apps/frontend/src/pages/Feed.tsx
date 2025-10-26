import React from "react";
import PageIntro from "../components/PageIntro";

const cardStyle: React.CSSProperties = {
  display: "grid",
  gap: "0.75rem",
  background: "rgba(15, 23, 42, 0.45)",
  borderRadius: "18px",
  padding: "1.5rem",
  border: "1px solid rgba(148, 163, 184, 0.18)",
};

const Feed: React.FC = () => (
  <PageIntro
    eyebrow="Community Stream"
    title="Share progress with teammates and followers."
    description="The feed filters sessions by visibility, so private work stays private while public achievements earn rightful hype."
  >
    <div
      style={{
        display: "grid",
        gap: "1rem",
      }}
    >
      {[
        {
          user: "Leah",
          note: "Hit a new 5RM on deadlifts at 170 kg — grip work is paying off!",
          stats: "17 likes · 6 comments",
        },
        {
          user: "Marco",
          note: "Shared a deload session plan with ankle rehab protocol.",
          stats: "Coach view · Link-only",
        },
        {
          user: "Team Nordic Velocity",
          note: "Weekly leaderboard: Emma reclaimed #1 spot with 98 streak points.",
          stats: "Pinned · Team feed",
        },
      ].map((item) => (
        <article key={item.user} style={cardStyle}>
          <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <strong style={{ fontSize: "1.05rem" }}>{item.user}</strong>
            <span style={{ fontSize: "0.85rem", color: "var(--color-text-secondary)" }}>
              moments ago
            </span>
          </header>
          <p style={{ margin: 0, color: "var(--color-text-secondary)", fontSize: "0.95rem" }}>
            {item.note}
          </p>
          <footer
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              fontSize: "0.9rem",
              color: "var(--color-text-secondary)",
            }}
          >
            {item.stats}
            <button
              type="button"
              style={{
                borderRadius: "12px",
                background: "rgba(56, 189, 248, 0.16)",
                border: "1px solid rgba(56, 189, 248, 0.25)",
                color: "#bae6fd",
                padding: "0.45rem 0.85rem",
                fontWeight: 600,
              }}
            >
              Open session
            </button>
          </footer>
        </article>
      ))}
    </div>
  </PageIntro>
);

export default Feed;
