import React from "react";
import PageIntro from "../components/PageIntro";
import { useTranslation } from "react-i18next";

const Planner: React.FC = () => {
  const { t } = useTranslation();

  return (
    <PageIntro
      eyebrow={t("planner.eyebrow")}
      title={t("planner.title")}
      description={t("planner.description")}
  >
    <div
      style={{
        display: "grid",
        gap: "1rem",
        background: "rgba(15, 23, 42, 0.5)}",
        borderRadius: "18px",
        padding: "1.5rem",
        border: "1px solid rgba(148, 163, 184, 0.18)}",
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
            background: "rgba(15, 23, 42, 0.35)}",
            border: "1px solid rgba(148, 163, 184, 0.15)}",
          }}
        >
          <div style={{ display: "grid", gap: "0.35rem" }}>
            <strong style={{ fontSize: "1.05rem" }}>{block}</strong>
            <span style={{ color: "var(--color-text-secondary)}", fontSize: "0.9rem" }}>
              Pull heavy, push moderate, accessories focused on posture.
            </span>
          </div>
          <button
            type="button"
            style={{
              borderRadius: "12px",
              padding: "0.5rem 0.9rem",
              background: "rgba(52, 211, 153, 0.16)}",
              color: "var(--color-accent)}",
              fontWeight: 600,
            }}
          >
            {t("planner.editBlock")}
          </button>
        </div>
      ))}
    </div>
  </PageIntro>
  );
};

export default Planner;
