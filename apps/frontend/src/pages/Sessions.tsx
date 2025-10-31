import React, { useState } from "react";
import PageIntro from "../components/PageIntro";
import { useTranslation } from "react-i18next";

const rowStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "2fr 1fr 1fr 1fr",
  gap: "0.75rem",
  alignItems: "center",
  padding: "0.85rem 1rem",
  background: "rgba(15, 23, 42, 0.4)",
  borderRadius: "14px",
  border: "1px solid rgba(148, 163, 184, 0.18)",
};

const Sessions: React.FC = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<"planner" | "logger">("planner");

  return (
    <PageIntro
      eyebrow={t("sessions.eyebrow")}
      title={t("sessions.title")}
      description={t("sessions.description")}
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
          onClick={() => setActiveTab("planner")}
          style={{
            padding: "0.75rem 1.5rem",
            borderRadius: "8px 8px 0 0",
            background: activeTab === "planner" ? "var(--color-accent)" : "transparent",
            color: activeTab === "planner" ? "#0f172a" : "var(--color-text-secondary)",
            fontWeight: activeTab === "planner" ? 600 : 500,
            border: "none",
            cursor: "pointer",
            transition: "all 150ms ease",
          }}
        >
          {t("sessions.plannerTab")}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("logger")}
          style={{
            padding: "0.75rem 1.5rem",
            borderRadius: "8px 8px 0 0",
            background: activeTab === "logger" ? "var(--color-accent)" : "transparent",
            color: activeTab === "logger" ? "#0f172a" : "var(--color-text-secondary)",
            fontWeight: activeTab === "logger" ? 600 : 500,
            border: "none",
            cursor: "pointer",
            transition: "all 150ms ease",
          }}
        >
          {t("sessions.loggerTab")}
        </button>
      </div>

      {/* Planner Tab Content */}
      {activeTab === "planner" && (
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
                  border: "none",
                  cursor: "pointer",
                }}
              >
                {t("planner.editBlock")}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Logger Tab Content */}
      {activeTab === "logger" && (
        <div
          style={{
            display: "grid",
            gap: "0.9rem",
          }}
        >
          <div
            style={{
              ...rowStyle,
              background: "rgba(52, 211, 153, 0.18)",
              color: "#0f172a",
              fontWeight: 600,
            }}
          >
            <span>Exercise</span>
            <span>Sets</span>
            <span>Reps</span>
            <span>Load</span>
          </div>
          {[
            { exercise: "Back Squat", sets: 5, reps: "5", load: "140 kg" },
            { exercise: "Bench Press", sets: 4, reps: "6", load: "95 kg" },
            { exercise: "Weighted Pull-up", sets: 3, reps: "8", load: "+20 kg" },
          ].map((entry) => (
            <div key={entry.exercise} style={rowStyle}>
              <strong>{entry.exercise}</strong>
              <span>{entry.sets}</span>
              <span>{entry.reps}</span>
              <span>{entry.load}</span>
            </div>
          ))}
        </div>
      )}
    </PageIntro>
  );
};

export default Sessions;
