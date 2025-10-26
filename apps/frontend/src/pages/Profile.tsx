import React from "react";
import PageIntro from "../components/PageIntro";

const Profile: React.FC = () => (
  <PageIntro
    eyebrow="Athlete Profile"
    title="Dial in preferences, privacy, and performance goals."
    description="Define visibility defaults, preferred units, and personal best milestones so every shared session reflects your story."
  >
    <div
      style={{
        display: "grid",
        gap: "1rem",
        background: "rgba(15, 23, 42, 0.5)",
        borderRadius: "18px",
        padding: "1.6rem",
        border: "1px solid rgba(148, 163, 184, 0.2)",
      }}
    >
      <div
        style={{
          display: "grid",
          gap: "0.4rem",
        }}
      >
        <strong>Visibility</strong>
        <span style={{ color: "var(--color-text-secondary)" }}>
          Default session visibility set to <b>Followers</b>. Switch to Public for comp prep recaps.
        </span>
      </div>
      <div
        style={{
          display: "grid",
          gap: "0.4rem",
        }}
      >
        <strong>Preferred units</strong>
        <span style={{ color: "var(--color-text-secondary)" }}>
          Weight in kilograms · Distance in kilometers · Pace in min/km.
        </span>
      </div>
      <div
        style={{
          display: "grid",
          gap: "0.4rem",
        }}
      >
        <strong>Signature achievements</strong>
        <span style={{ color: "var(--color-text-secondary)" }}>
          180 kg back squat · 115 kg bench · 210 kg deadlift · Boston Marathon qualifier.
        </span>
      </div>
      <button
        type="button"
        style={{
          justifySelf: "flex-start",
          borderRadius: "14px",
          padding: "0.85rem 1.3rem",
          background: "rgba(248, 250, 252, 0.08)",
          color: "var(--color-text-primary)",
          fontWeight: 600,
          border: "1px solid rgba(148, 163, 184, 0.2)",
        }}
      >
        Edit profile
      </button>
    </div>
  </PageIntro>
);

export default Profile;
