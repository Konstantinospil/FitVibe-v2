import React from "react";

type Status = "checking" | "online" | "offline";

const STATUS_LABELS: Record<Status, string> = {
  checking: "Checking backend…",
  online: "Backend online",
  offline: "Backend offline",
};

const STATUS_COLORS: Record<Status, { fg: string; bg: string }> = {
  checking: { fg: "#fbbf24", bg: "rgba(251, 191, 36, 0.16)" },
  online: { fg: "#34d399", bg: "rgba(52, 211, 153, 0.16)" },
  offline: { fg: "#f87171", bg: "rgba(248, 113, 113, 0.16)" },
};

interface StatusPillProps {
  status: Status;
}

const StatusPill: React.FC<StatusPillProps> = ({ status }) => {
  const { fg, bg } = STATUS_COLORS[status];
  const label = STATUS_LABELS[status];
  const showPulse = status === "checking";

  return (
    <span
      role="status"
      aria-live="polite"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "0.5rem",
        padding: "0.35rem 0.85rem",
        borderRadius: "999px",
        fontSize: "0.95rem",
        letterSpacing: "0.01em",
        fontWeight: 500,
        color: fg,
        backgroundColor: bg,
        border: `1px solid ${fg}1a`,
      }}
    >
      <span
        style={{
          width: "0.65rem",
          height: "0.65rem",
          borderRadius: "50%",
          backgroundColor: fg,
          opacity: showPulse ? 0.7 : 1,
          boxShadow: showPulse ? `0 0 0 6px ${fg}33` : "none",
          transition: "opacity 200ms ease, box-shadow 200ms ease",
        }}
        className={showPulse ? "status-pulse" : undefined}
      />
      {label}
    </span>
  );
};

export { StatusPill };
