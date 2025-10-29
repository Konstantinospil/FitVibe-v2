import React from "react";
import { useTranslation } from "react-i18next";

type Status = "checking" | "online" | "offline";

const STATUS_STYLE: Record<Status, { fg: string; bg: string; border: string; pulse: string }> = {
  checking: {
    fg: "var(--color-warning)",
    bg: "var(--color-warning-soft)",
    border: "rgba(251,191,36,0.35)",
    pulse: "rgba(251,191,36,0.35)",
  },
  online: {
    fg: "var(--color-accent)",
    bg: "var(--color-accent-soft)",
    border: "rgba(52,211,153,0.28)",
    pulse: "rgba(52,211,153,0.35)",
  },
  offline: {
    fg: "var(--color-danger)",
    bg: "rgba(248,113,113,0.16)",
    border: "rgba(248,113,113,0.28)",
    pulse: "rgba(248,113,113,0.3)",
  },
};

interface StatusPillProps {
  status: Status;
  /** allow text or nodes inside the pill */
  children?: React.ReactNode;
}

const StatusPill: React.FC<StatusPillProps> = ({ status, children }) => {
  const { fg, bg, border, pulse } = STATUS_STYLE[status];
  const { t } = useTranslation();
  const label =
    typeof children === "string" && children.trim().length > 0
      ? children
      : t(`status.${status}`, { defaultValue: status });
  const showPulse = status === "checking";

  return (
    <span
      role="status"
      aria-live="polite"
      aria-label={typeof label === "string" ? label : undefined}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "0.5rem",
        padding: "0.35rem 0.85rem",
        borderRadius: "999px",
        fontSize: "var(--font-size-sm)",
        letterSpacing: "0.01em",
        fontWeight: 500,
        color: fg,
        backgroundColor: bg,
        border: `1px solid ${border}`,
        boxShadow: showPulse ? `0 0 6px ${pulse}` : "none",
      }}
    >
      <span
        style={{
          width: "0.65rem",
          height: "0.65rem",
          borderRadius: "50%",
          backgroundColor: fg,
          opacity: showPulse ? 0.85 : 1,
        }}
      />
      <span>{label}</span>
    </span>
  );
};

export default StatusPill;
export { StatusPill };
