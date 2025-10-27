import React from "react";
import { useTranslation } from "react-i18next";
import PageIntro from "../components/PageIntro";
import { Button, VisibilityBadge, type VisibilityLevel } from "../components/ui";

const cardStyle: React.CSSProperties = {
  display: "grid",
  gap: "0.75rem",
  background: "var(--color-surface-glass)",
  borderRadius: "18px",
  padding: "1.5rem",
  border: "1px solid var(--color-border)",
};

const Feed: React.FC = () => {
  const { t } = useTranslation();

  const items = ["leah", "marco", "team"].map((id) => ({
    id,
    user: t(`feed.items.${id}.user`),
    note: t(`feed.items.${id}.note`),
    stats: t(`feed.items.${id}.stats`),
    visibility: t(`feed.items.${id}.visibility`) as VisibilityLevel,
  }));

  return (
    <PageIntro
      eyebrow={t("feed.eyebrow")}
      title={t("feed.title")}
      description={t("feed.description")}
    >
      <div
        style={{
          display: "grid",
          gap: "1rem",
        }}
      >
        {items.map((item) => {
          const guardMessage = t(`visibility.guards.${item.visibility}`);
          const isRestricted = item.visibility === "private";

          return (
            <article key={item.id} style={cardStyle}>
              <header
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: "1rem",
                }}
              >
                <div style={{ display: "grid", gap: "0.25rem" }}>
                  <strong style={{ fontSize: "1.05rem" }}>{item.user}</strong>
                  <span style={{ fontSize: "0.85rem", color: "var(--color-text-muted)" }}>
                    {t("feed.timestamp")}
                  </span>
                </div>
                <VisibilityBadge level={item.visibility} />
              </header>
              <p style={{ margin: 0, color: "var(--color-text-secondary)", fontSize: "0.95rem" }}>
                {item.note}
              </p>
              <footer
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: "0.75rem",
                  fontSize: "0.9rem",
                  color: "var(--color-text-secondary)",
                }}
              >
                <span>{item.stats}</span>
                <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                  {isRestricted ? (
                    <span style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>
                      {guardMessage}
                    </span>
                  ) : null}
                  <Button type="button" size="sm" variant="secondary" disabled={isRestricted}>
                    {t("feed.button")}
                  </Button>
                </div>
              </footer>
            </article>
          );
        })}
      </div>
    </PageIntro>
  );
};

export default Feed;
