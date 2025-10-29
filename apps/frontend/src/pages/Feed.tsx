import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import PageIntro from "../components/PageIntro";
import { Button, VisibilityBadge, Skeleton } from "../components/ui";
import { getFeed, likeFeedItem, unlikeFeedItem, cloneSessionFromFeed } from "../services/api";
import type { VisibilityLevel } from "../components/ui";

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
  const queryClient = useQueryClient();
  const [limit] = useState(20);
  const [offset] = useState(0);

  const { data, isLoading, error } = useQuery({
    queryKey: ["feed", { scope: "public", limit, offset }],
    queryFn: () => getFeed({ scope: "public", limit, offset }),
  });

  const likeMutation = useMutation({
    mutationFn: likeFeedItem,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["feed"] });
    },
  });

  const unlikeMutation = useMutation({
    mutationFn: unlikeFeedItem,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["feed"] });
    },
  });

  const cloneMutation = useMutation({
    mutationFn: cloneSessionFromFeed,
    onSuccess: () => {
      alert(t("feed.cloneSuccess") || "Session cloned successfully!");
    },
  });

  const handleLikeToggle = (feedItemId: string, isLiked: boolean) => {
    if (isLiked) {
      unlikeMutation.mutate(feedItemId);
    } else {
      likeMutation.mutate(feedItemId);
    }
  };

  const handleClone = (sessionId: string) => {
    cloneMutation.mutate(sessionId);
  };

  if (isLoading) {
    return (
      <PageIntro
        eyebrow={t("feed.eyebrow")}
        title={t("feed.title")}
        description={t("feed.description")}
      >
        <div style={{ display: "grid", gap: "1rem" }}>
          {[1, 2, 3].map((i) => (
            <div key={i} style={cardStyle}>
              <Skeleton width="100%" height="60px" />
              <Skeleton width="100%" height="40px" />
              <Skeleton width="100%" height="30px" />
            </div>
          ))}
        </div>
      </PageIntro>
    );
  }

  if (error) {
    return (
      <PageIntro
        eyebrow={t("feed.eyebrow")}
        title={t("feed.title")}
        description={t("feed.description")}
      >
        <div
          style={{
            padding: "2rem",
            textAlign: "center",
            color: "var(--color-text-secondary)",
            background: "var(--color-surface-glass)",
            borderRadius: "18px",
            border: "1px solid var(--color-border)",
          }}
        >
          <p>{t("feed.error") || "Failed to load feed. Please try again later."}</p>
        </div>
      </PageIntro>
    );
  }

  const items = data?.items || [];

  if (items.length === 0) {
    return (
      <PageIntro
        eyebrow={t("feed.eyebrow")}
        title={t("feed.title")}
        description={t("feed.description")}
      >
        <div
          style={{
            padding: "2rem",
            textAlign: "center",
            color: "var(--color-text-muted)",
            background: "var(--color-surface-glass)",
            borderRadius: "18px",
            border: "1px solid var(--color-border)",
          }}
        >
          <p>{t("feed.empty") || "No activity yet. Start training and share your sessions!"}</p>
        </div>
      </PageIntro>
    );
  }

  return (
    <PageIntro
      eyebrow={t("feed.eyebrow")}
      title={t("feed.title")}
      description={t("feed.description")}
    >
      <div style={{ display: "grid", gap: "1rem" }}>
        {items.map((item) => {
          const isRestricted = item.visibility === "private";
          const displayName = item.user.displayName || item.user.username;

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
                  <strong style={{ fontSize: "1.05rem" }}>{displayName}</strong>
                  <span style={{ fontSize: "0.85rem", color: "var(--color-text-muted)" }}>
                    {new Date(item.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <VisibilityBadge level={item.visibility as VisibilityLevel} />
              </header>
              <div>
                {item.session.title && (
                  <strong style={{ display: "block", marginBottom: "0.5rem" }}>
                    {item.session.title}
                  </strong>
                )}
                {item.session.notes && (
                  <p
                    style={{
                      margin: 0,
                      color: "var(--color-text-secondary)",
                      fontSize: "0.95rem",
                    }}
                  >
                    {item.session.notes}
                  </p>
                )}
              </div>
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
                <span>
                  {item.session.exerciseCount} {t("feed.exercises") || "exercises"} •{" "}
                  {item.session.totalVolume
                    ? `${(item.session.totalVolume / 1000).toFixed(1)}k kg`
                    : "No volume data"}
                </span>
                <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                  <Button
                    type="button"
                    size="sm"
                    variant={item.isLiked ? "primary" : "ghost"}
                    onClick={() => handleLikeToggle(item.id, Boolean(item.isLiked))}
                    disabled={likeMutation.isPending || unlikeMutation.isPending}
                  >
                    {item.isLiked ? "♥" : "♡"} {item.likesCount}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    disabled={isRestricted || cloneMutation.isPending}
                    onClick={() => handleClone(item.session.id)}
                  >
                    {t("feed.button") || "Clone"}
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
