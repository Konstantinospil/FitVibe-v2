import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button, VisibilityBadge } from "./ui";

interface ShareLink {
  id: string;
  token: string;
  createdAt: string;
  revokedAt?: string;
}

const buildShareUrl = (token: string) => `https://fitvibe.app/share/${token}`;

const randomId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);

const generateToken = () => randomId().slice(0, 8).toUpperCase();

const ShareLinkManager: React.FC = () => {
  const { t } = useTranslation();
  const [links, setLinks] = useState<ShareLink[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isCopying, setIsCopying] = useState(false);

  const createLink = () => {
    const token = generateToken();
    const newLink: ShareLink = {
      id: randomId(),
      token,
      createdAt: new Date().toISOString(),
    };
    setLinks((previous) => [newLink, ...previous]);
    setCopiedId(null);
  };

  const copyLink = async (link: ShareLink) => {
    try {
      setIsCopying(true);
      await navigator.clipboard?.writeText(buildShareUrl(link.token));
      setCopiedId(link.id);
    } catch (error) {
      console.warn("Unable to copy link", error);
    } finally {
      setIsCopying(false);
    }
  };

  const revokeLink = (id: string) => {
    setLinks((previous) =>
      previous.map((link) =>
        link.id === id
          ? {
              ...link,
              revokedAt: new Date().toISOString(),
            }
          : link,
      ),
    );
    if (copiedId === id) {
      setCopiedId(null);
    }
  };

  return (
    <section
      style={{
        display: "grid",
        gap: "1rem",
        borderRadius: "18px",
        padding: "1.6rem",
        background: "var(--color-surface-glass)",
        border: "1px solid var(--color-border)",
      }}
    >
      <header style={{ display: "grid", gap: "0.5rem" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "1rem",
          }}
        >
          <div>
            <strong style={{ fontSize: "1.1rem" }}>{t("profile.share.title")}</strong>
            <p style={{ margin: 0, color: "var(--color-text-secondary)", fontSize: "0.9rem" }}>
              {t("profile.share.description")}
            </p>
          </div>
          <Button type="button" size="sm" variant="secondary" onClick={createLink}>
            {t("profile.share.create")}
          </Button>
        </div>
      </header>

      {links.length === 0 ? (
        <p style={{ margin: 0, color: "var(--color-text-muted)" }}>{t("profile.share.empty")}</p>
      ) : (
        <ul
          style={{
            listStyle: "none",
            margin: 0,
            padding: 0,
            display: "grid",
            gap: "0.75rem",
          }}
        >
          {links.map((link) => {
            const isRevoked = Boolean(link.revokedAt);
            const shareUrl = buildShareUrl(link.token);
            return (
              <li
                key={link.id}
                style={{
                  border: "1px solid var(--color-border)",
                  borderRadius: "14px",
                  padding: "1rem",
                  display: "grid",
                  gap: "0.6rem",
                  background: "rgba(15, 23, 42, 0.4)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: "0.75rem",
                    flexWrap: "wrap",
                  }}
                >
                  <code style={{ fontSize: "0.95rem", letterSpacing: "0.08em" }}>{shareUrl}</code>
                  <VisibilityBadge level={isRevoked ? "private" : "link"} />
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                    gap: "0.75rem",
                    fontSize: "0.85rem",
                    color: "var(--color-text-muted)",
                  }}
                >
                  <span>
                    {isRevoked
                      ? t("profile.share.guards.revoked")
                      : t("profile.share.guards.active")}
                  </span>
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      onClick={() => void copyLink(link)}
                      disabled={isRevoked || isCopying}
                    >
                      {copiedId === link.id ? t("profile.share.copied") : t("profile.share.copy")}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => revokeLink(link.id)}
                      disabled={isRevoked}
                    >
                      {isRevoked ? t("profile.share.revoked") : t("profile.share.revoke")}
                    </Button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
};

export default ShareLinkManager;
