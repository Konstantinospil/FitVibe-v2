import React from "react";
import PageIntro from "../components/PageIntro";

const inputStyle: React.CSSProperties = {
  width: "100%",
  borderRadius: "12px",
  border: "1px solid rgba(148, 163, 184, 0.35)",
  background: "rgba(15, 23, 42, 0.35)",
  color: "var(--color-text-primary)",
  padding: "0.85rem 1rem",
  fontSize: "1rem",
};

const Login: React.FC = () => (
  <PageIntro
    eyebrow="Secure Access"
    title="Log back in to continue your training streak."
    description="We rotate login tokens automatically and enforce session hygiene so you can rely on FitVibe for competition prep and daily discipline."
  >
    <form
      style={{
        display: "grid",
        gap: "1rem",
        background: "rgba(15, 23, 42, 0.55)",
        borderRadius: "20px",
        padding: "1.75rem",
        border: "1px solid rgba(148, 163, 184, 0.25)",
      }}
    >
      <label style={{ display: "grid", gap: "0.35rem" }}>
        <span style={{ fontSize: "0.95rem", color: "var(--color-text-secondary)" }}>Email</span>
        <input type="email" placeholder="you@fitvibe.app" style={inputStyle} />
      </label>
      <label style={{ display: "grid", gap: "0.35rem" }}>
        <span style={{ fontSize: "0.95rem", color: "var(--color-text-secondary)" }}>Password</span>
        <input type="password" placeholder="••••••••" style={inputStyle} />
      </label>
      <button
        type="button"
        style={{
          marginTop: "0.5rem",
          borderRadius: "14px",
          padding: "0.9rem 1rem",
          background: "var(--color-accent)",
          color: "#0f172a",
          fontWeight: 600,
          letterSpacing: "0.02em",
        }}
      >
        Sign In
      </button>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: "0.9rem",
          color: "var(--color-text-secondary)",
        }}
      >
        <a href="#recover" style={{ color: "var(--color-text-secondary)" }}>
          Forgot password?
        </a>
        <a href="#register" style={{ color: "var(--color-text-secondary)" }}>
          Create account
        </a>
      </div>
    </form>
  </PageIntro>
);

export default Login;
