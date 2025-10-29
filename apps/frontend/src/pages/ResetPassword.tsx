import React, { useState } from "react";
import { NavLink, useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import PageIntro from "../components/PageIntro";
import { Button } from "../components/ui";
import { resetPassword } from "../services/api";

const inputStyle: React.CSSProperties = {
  width: "100%",
  borderRadius: "12px",
  border: "1px solid rgba(148, 163, 184, 0.35)}",
  background: "rgba(15, 23, 42, 0.35)}",
  color: "var(--color-text-primary)}",
  padding: "0.85rem 1rem",
  fontSize: "1rem",
};

const ResetPassword: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError(t("auth.resetPassword.passwordMismatch") || t("resetPassword.passwordMismatch"));
      return;
    }

    if (!token) {
      setError(
        t("auth.resetPassword.invalidToken") ||
          t("resetPassword.invalidToken"),
      );
      return;
    }

    setIsSubmitting(true);

    try {
      await resetPassword({ token, newPassword: password });
      setSuccess(true);
      // Redirect to login after 2 seconds
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (err: unknown) {
      if (err && typeof err === "object" && "response" in err) {
        const axiosError = err as { response?: { data?: { error?: { message?: string } } } };
        setError(
          axiosError.response?.data?.error?.message ||
            t("auth.resetPassword.error") ||
            t("resetPassword.errorReset"),
        );
      } else {
        setError(t("auth.resetPassword.error") || t("resetPassword.errorReset"));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <PageIntro
        eyebrow={t("auth.resetPassword.eyebrow") || "Password Reset"}
        title={t("auth.resetPassword.successTitle") || t("resetPassword.titleSuccess")}
        description={
          t("auth.resetPassword.successDescription") ||
          t("resetPassword.descSuccess")
        }
      >
        <div
          style={{
            background: "rgba(34, 197, 94, 0.16)}",
            color: "#86efac",
            borderRadius: "12px",
            padding: "0.75rem 1rem",
            fontSize: "0.95rem",
          }}
        >
          {t("auth.resetPassword.successMessage") || t("resetPassword.successText")}
        </div>
      </PageIntro>
    );
  }

  return (
    <PageIntro
      eyebrow={t("auth.resetPassword.eyebrow") || "Password Reset"}
      title={t("auth.resetPassword.title") || t("resetPassword.title")}
      description={
        t("auth.resetPassword.description") || t("resetPassword.description")
      }
    >
      {/* eslint-disable-next-line @typescript-eslint/no-misused-promises */}
      <form onSubmit={handleSubmit} style={{ display: "grid", gap: "1rem" }}>
        <label style={{ display: "grid", gap: "0.35rem" }}>
          <span style={{ fontSize: "0.95rem", color: "var(--color-text-secondary)}" }}>
            {t("auth.resetPassword.passwordLabel") || t("resetPassword.newPasswordLabel")}
          </span>
          <input
            name="password"
            type="password"
            placeholder={t("auth.placeholders.password") || t("resetPassword.newPasswordPlaceholder")}
            style={inputStyle}
            required
            minLength={12}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="new-password"
            disabled={isSubmitting}
          />
        </label>
        <label style={{ display: "grid", gap: "0.35rem" }}>
          <span style={{ fontSize: "0.95rem", color: "var(--color-text-secondary)}" }}>
            {t("auth.resetPassword.confirmPasswordLabel") || t("resetPassword.confirmPasswordLabel")}
          </span>
          <input
            name="confirmPassword"
            type="password"
            placeholder={t("auth.placeholders.confirmPassword") || t("resetPassword.confirmPasswordLabel")}
            style={inputStyle}
            required
            minLength={12}
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            autoComplete="new-password"
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
            ? t("auth.resetPassword.submitting") || t("resetPassword.resetting")
            : t("auth.resetPassword.submit") || t("resetPassword.resetButton")}
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
          {t("auth.resetPassword.backToLogin") || "Back to login"}
        </NavLink>
      </form>
    </PageIntro>
  );
};

export default ResetPassword;
