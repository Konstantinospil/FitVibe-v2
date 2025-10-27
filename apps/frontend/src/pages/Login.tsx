import React, { useState } from "react";
import { useNavigate, useLocation, NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import PageIntro from "../components/PageIntro";
import { Button } from "../components/ui";
import { useAuth } from "../contexts/AuthContext";
import { login } from "../services/api";

const inputStyle: React.CSSProperties = {
  width: "100%",
  borderRadius: "12px",
  border: "1px solid rgba(148, 163, 184, 0.35)",
  background: "rgba(15, 23, 42, 0.35)",
  color: "var(--color-text-primary)",
  padding: "0.85rem 1rem",
  fontSize: "1rem",
};

const Login: React.FC = () => {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const from = (location.state as { from?: { pathname?: string } })?.from?.pathname ?? "/dashboard";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const tokens = await login({ email, password });
      signIn(tokens);
      navigate(from, { replace: true });
    } catch {
      setError(t("auth.login.error"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageIntro
      eyebrow={t("auth.login.eyebrow")}
      title={t("auth.login.title")}
      description={t("auth.login.description")}
    >
      <form onSubmit={handleSubmit} style={{ display: "grid", gap: "1rem" }}>
        <label style={{ display: "grid", gap: "0.35rem" }}>
          <span style={{ fontSize: "0.95rem", color: "var(--color-text-secondary)" }}>
            {t("auth.login.emailLabel")}
          </span>
          <input
            name="email"
            type="email"
            placeholder={t("auth.placeholders.email")}
            style={inputStyle}
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            disabled={isSubmitting}
          />
        </label>
        <label style={{ display: "grid", gap: "0.35rem" }}>
          <span style={{ fontSize: "0.95rem", color: "var(--color-text-secondary)" }}>
            {t("auth.login.passwordLabel")}
          </span>
          <input
            name="password"
            type="password"
            placeholder={t("auth.placeholders.password")}
            style={inputStyle}
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            disabled={isSubmitting}
          />
        </label>
        {error ? (
          <div
            role="alert"
            style={{
              background: "rgba(248, 113, 113, 0.16)",
              color: "#fecaca",
              borderRadius: "12px",
              padding: "0.75rem 1rem",
              fontSize: "0.95rem",
            }}
          >
            {error}
          </div>
        ) : null}
        <Button type="submit" fullWidth isLoading={isSubmitting} disabled={isSubmitting}>
          {isSubmitting ? t("auth.login.submitting") : t("auth.login.submit")}
        </Button>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: "0.9rem",
            color: "var(--color-text-secondary)",
          }}
        >
          <NavLink to="/register" style={{ color: "var(--color-text-secondary)" }}>
            {t("auth.login.registerPrompt")}
          </NavLink>
          <span>{t("auth.login.forgot")}</span>
        </div>
      </form>
    </PageIntro>
  );
};

export default Login;
