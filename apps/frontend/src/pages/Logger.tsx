import React from "react";
import PageIntro from "../components/PageIntro";
import { useTranslation } from "react-i18next";

const rowStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "2fr 1fr 1fr 1fr",
  gap: "0.75rem",
  alignItems: "center",
  padding: "0.85rem 1rem",
  background: "rgba(15, 23, 42, 0.4)}",
  borderRadius: "14px",
  border: "1px solid rgba(148, 163, 184, 0.18)}",
};

const Logger: React.FC = () => {
  const { t } = useTranslation();

  return (
    <PageIntro
      eyebrow={t("logger.eyebrow")}
      title={t("logger.title")}
      description={t("logger.description")}
  >
    <div
      style={{
        display: "grid",
        gap: "0.9rem",
      }}
    >
      <div
        style={{
          ...rowStyle,
          background: "rgba(52, 211, 153, 0.18)}",
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
  </PageIntro>
  );
};

export default Logger;
