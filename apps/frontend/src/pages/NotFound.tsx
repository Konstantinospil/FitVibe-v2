import React from "react";
import PageIntro from "../components/PageIntro";
import { NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";

const NotFound: React.FC = () => {
  const { t } = useTranslation();

  return (
    <PageIntro
      eyebrow={t("notFound.eyebrow")}
      title={t("notFound.title")}
      description={t("notFound.description")}
  >
    <div
      style={{
        display: "flex",
        gap: "1rem",
        flexWrap: "wrap",
      }}
    >
      <NavLink
        to="/dashboard"
        style={{
          padding: "0.9rem 1.4rem",
          borderRadius: "999px",
          background: "var(--color-accent)}",
          color: "#0f172a",
          fontWeight: 600,
          letterSpacing: "0.02em",
        }}
      >
        {t("notFound.takeMeHome")}
      </NavLink>
      <NavLink
        to="/"
        style={{
          padding: "0.9rem 1.4rem",
          borderRadius: "999px",
          background: "rgba(15, 23, 42, 0.4)}",
          border: "1px solid rgba(148, 163, 184, 0.2)}",
          color: "var(--color-text-secondary)}",
          fontWeight: 600,
          letterSpacing: "0.02em",
        }}
      >
        {t("notFound.goToLanding")}
      </NavLink>
    </div>
  </PageIntro>
  );
};

export default NotFound;
