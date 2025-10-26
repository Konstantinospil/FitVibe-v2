import React from "react";
import PageIntro from "../components/PageIntro";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";

const inputStyle: React.CSSProperties = {
  width: "100%",
  borderRadius: "12px",
  border: "1px solid rgba(148, 163, 184, 0.35)",
  background: "rgba(15, 23, 42, 0.35)",
  color: "var(--color-text-primary)",
  padding: "0.85rem 1rem",
  fontSize: "1rem",
};

const Register: React.FC = () => {
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    signIn();
    navigate("/dashboard", { replace: true });
  };

  return (
    <PageIntro
      eyebrow="Join FitVibe"
      title="Register to unlock collaborative training."
      description="Create your athlete profile, set training preferences, and invite your coach. We’ll keep sensitive data private by default."
    >
      <form
        onSubmit={handleSubmit}
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
          <span style={{ fontSize: "0.95rem", color: "var(--color-text-secondary)" }}>
            Display name
          </span>
          <input type="text" placeholder="Jamie Carter" style={inputStyle} required />
        </label>
        <label style={{ display: "grid", gap: "0.35rem" }}>
          <span style={{ fontSize: "0.95rem", color: "var(--color-text-secondary)" }}>Email</span>
          <input type="email" placeholder="you@fitvibe.app" style={inputStyle} required />
        </label>
        <label style={{ display: "grid", gap: "0.35rem" }}>
          <span style={{ fontSize: "0.95rem", color: "var(--color-text-secondary)" }}>
            Password
          </span>
          <input type="password" placeholder="••••••••" style={inputStyle} required />
        </label>
        <button
          type="submit"
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
          Create account
        </button>
        <p
          style={{
            margin: 0,
            fontSize: "0.9rem",
            color: "var(--color-text-secondary)",
            textAlign: "center",
          }}
        >
          Already training with us?{" "}
          <a href="/login" style={{ color: "var(--color-text-secondary)" }}>
            Sign in
          </a>
        </p>
      </form>
    </PageIntro>
  );
};

export default Register;
