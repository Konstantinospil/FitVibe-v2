import React, { useState } from "react";
import PageIntro from "../components/PageIntro";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate, NavLink } from "react-router-dom";
import { register as registerAccount } from "../services/api";
import { Button } from "../components/ui";
import { useTranslation } from "react-i18next";

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
  const { t } = useTranslation();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const tokens = await registerAccount({ name, email, password });
      signIn(tokens);
      navigate("/dashboard", { replace: true });
    } catch {
      setError(t("auth.register.error"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageIntro
      eyebrow={t("auth.register.eyebrow")}
      title={t("auth.register.title")}
      description={t("auth.register.description")}
    >
      <form onSubmit={handleSubmit} style={{ display: "grid", gap: "1rem" }}>
        <label style={{ display: "grid", gap: "0.35rem" }}>
          <span style={{ fontSize: "0.95rem", color: "var(--color-text-secondary)" }}>
            {t("auth.register.nameLabel")}
          </span>
          <input
            name="name"
            type="text"
            placeholder={t("auth.placeholders.name")}
            style={inputStyle}
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
            autoComplete="name"
            disabled={isSubmitting}
          />
        </label>
        <label style={{ display: "grid", gap: "0.35rem" }}>
          <span style={{ fontSize: "0.95rem", color: "var(--color-text-secondary)" }}>
            {t("auth.register.emailLabel")}
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
            {t("auth.register.passwordLabel")}
          </span>
          <input
            name="password"
            type="password"
            placeholder={t("auth.placeholders.password")}
            style={inputStyle}
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="new-password"
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
          {isSubmitting ? t("auth.register.submitting") : t("auth.register.submit")}
        </Button>
        <p
          style={{
            margin: 0,
            fontSize: "0.9rem",
            color: "var(--color-text-secondary)",
            textAlign: "center",
          }}
        >
          {t("auth.register.loginPrompt")}{" "}
          <NavLink to="/login" style={{ color: "var(--color-text-secondary)" }}>
            {t("auth.register.loginLink")}
          </NavLink>
        </p>
      </form>
    </PageIntro>
  );
};

export default Register;
