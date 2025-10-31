import React from "react";
import { useTranslation } from "react-i18next";

type VisibilityLevel = "private" | "link" | "public";

const STYLE_MAP: Record<VisibilityLevel, { background: string; color: string; border: string }> = {
  private: {
    background: "rgba(248, 113, 113, 0.16)",
    color: "#FFFFFF",
    border: "rgba(248, 113, 113, 0.35)",
  },
  link: {
    background: "rgba(56, 189, 248, 0.12)",
    color: "#FFFFFF",
    border: "rgba(56, 189, 248, 0.28)",
  },
  public: {
    background: "rgba(52, 211, 153, 0.16)",
    color: "#FFFFFF",
    border: "rgba(52, 211, 153, 0.28)",
  },
};

interface VisibilityBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  level: VisibilityLevel;
}

const indicatorStyle: React.CSSProperties = {
  width: "0.45rem",
  height: "0.45rem",
  borderRadius: "50%",
};

const VisibilityBadge: React.FC<VisibilityBadgeProps> = ({ level, style, ...rest }) => {
  const { t } = useTranslation();
  const palette = STYLE_MAP[level];

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "0.4rem",
        padding: "0.25rem 0.7rem",
        borderRadius: "999px",
        fontSize: "0.8rem",
        fontWeight: 600,
        background: palette.background,
        color: palette.color,
        border: `1px solid ${palette.border}`,
        ...style,
      }}
      {...rest}
    >
      <span aria-hidden="true" style={{ ...indicatorStyle, background: palette.color }} />
      {t(`visibility.labels.${level}`)}
    </span>
  );
};

export default VisibilityBadge;
export type { VisibilityLevel };
