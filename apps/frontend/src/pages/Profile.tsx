import React from "react";
import { useTranslation } from "react-i18next";
import PageIntro from "../components/PageIntro";
import ShareLinkManager from "../components/ShareLinkManager";
import { Button } from "../components/ui";

const cardStyle: React.CSSProperties = {
  display: "grid",
  gap: "1rem",
  background: "var(--color-surface-glass)",
  borderRadius: "18px",
  padding: "1.6rem",
  border: "1px solid var(--color-border)",
};

const listStyle: React.CSSProperties = {
  display: "grid",
  gap: "0.75rem",
};

const Profile: React.FC = () => {
  const { t } = useTranslation();

  const sections = ["visibility", "units", "achievements"] as const;

  return (
    <PageIntro
      eyebrow={t("profile.eyebrow")}
      title={t("profile.title")}
      description={t("profile.description")}
    >
      <div style={cardStyle}>
        <div style={listStyle}>
          {sections.map((section) => (
            <div key={section} style={{ display: "grid", gap: "0.3rem" }}>
              <strong>{t(`profile.sections.${section}.title`)}</strong>
              <span style={{ color: "var(--color-text-secondary)" }}>
                {t(`profile.sections.${section}.description`)}
              </span>
            </div>
          ))}
        </div>
        <Button type="button" variant="secondary" style={{ justifySelf: "flex-start" }}>
          {t("profile.edit")}
        </Button>
      </div>

      <ShareLinkManager />
    </PageIntro>
  );
};

export default Profile;
