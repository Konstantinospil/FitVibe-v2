import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import PageIntro from "../components/PageIntro";
import { Button } from "../components/ui";
import { forgotPassword } from "../services/api";

const inputStyle: React.CSSProperties = {
  width: "100%",
  borderRadius: "12px",
  border: "1px solid rgba(148, 163, 184, 0.35)}",
  background: "rgba(15, 23, 42, 0.35)}",
  color: "var(--color-text-primary)}",
  padding: "0.85rem 1rem",
  fontSize: "1rem",
};

const ForgotPassword: React.FC = () => {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await forgotPassword({ email });
      setSuccess(true);
    } catch (err: unknown) {
      if (err && typeof err === "object" && "response" in err) {
        const axiosError = err as { response?: { data?: { error?: { message?: string } } } };
        setError(
          axiosError.response?.data?.error?.message ||
            t("auth.forgotPassword.error") ||
            t("forgotPassword.errorSend"),
        );
      } else {
        setError(t("auth.forgotPassword.error") || t("forgotPassword.errorSend"));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <PageIntro
        eyebrow={t("auth.forgotPassword.eyebrow") || t("forgotPassword.eyebrow")}
        title={t("auth.forgotPassword.successTitle") || t("forgotPassword.titleSuccess")}
        description={
          t("auth.forgotPassword.successDescription") ||
          t("forgotPassword.descSuccess")
        }
      >
        <div style={{ display: "grid", gap: "1rem" }}>
          <div
            style={{
              background: "rgba(34, 197, 94, 0.16)}",
              color: "#86efac",
              borderRadius: "12px",
              padding: "0.75rem 1rem",
              fontSize: "0.95rem",
            }}
          >
            {t("auth.forgotPassword.successMessage") ||
              t("forgotPassword.successMessage")}
          </div>
          <NavLink
            to="/login"
            style={{
              display: "block",
              textAlign: "center",
              color: "var(--color-text-secondary)}",
              fontSize: "0.9rem",
            }}
          >
            {t("auth.forgotPassword.backToLogin") || t("forgotPassword.backToLogin")}
          </NavLink>
        </div>
      </PageIntro>
    );
  }

  return (
    <PageIntro
      eyebrow={t("auth.forgotPassword.eyebrow") || t("forgotPassword.eyebrow")}
      title={t("auth.forgotPassword.title") || t("forgotPassword.title")}
      description={
        t("auth.forgotPassword.description") ||
        t("forgotPassword.description")
      }
    >
      {/* eslint-disable-next-line @typescript-eslint/no-misused-promises */}
      <form onSubmit={handleSubmit} style={{ display: "grid", gap: "1rem" }}>
        <label style={{ display: "grid", gap: "0.35rem" }}>
          <span style={{ fontSize: "0.95rem", color: "var(--color-text-secondary)}" }}>
            {t("auth.forgotPassword.emailLabel") || t("forgotPassword.emailLabel")}
          </span>
          <input
            name="email"
            type="email"
            placeholder={t("auth.placeholders.email") || t("forgotPassword.emailPlaceholder")}
            style={inputStyle}
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            disabled={isSubmitting}
          />
        </label>
        {error ? (
          <div
            role="alert"
            style={{
              background: "rgba(248, 113, 113, 0.16)}",
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
          {isSubmitting
            ? t("auth.forgotPassword.submitting") || t("forgotPassword.sending")
            : t("auth.forgotPassword.submit") || t("forgotPassword.sendLink")}
        </Button>
        <NavLink
          to="/login"
          style={{
            display: "block",
            textAlign: "center",
            color: "var(--color-text-secondary)}",
            fontSize: "0.9rem",
          }}
        >
          {t("auth.forgotPassword.backToLogin") || t("forgotPassword.backToLogin")}
        </NavLink>
      </form>
    </PageIntro>
  );
};

export default ForgotPassword;
