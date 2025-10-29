import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import PageIntro from "../components/PageIntro";
import { Button } from "../components/ui";
import { useTranslation } from "react-i18next";
import { rawHttpClient } from "../services/api";

const VerifyEmail: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<"verifying" | "success" | "error">("verifying");
  const [errorMessage, setErrorMessage] = useState<string>("");

  useEffect(() => {
    const token = searchParams.get("token");
    
    if (!token) {
      setStatus("error");
      setErrorMessage(t("verifyEmail.noToken"));
      return;
    }

    const verifyEmail = async () => {
      try {
        await rawHttpClient.get(`/api/v1/auth/verify?token=${token}`);
        setStatus("success");
        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate("/login");
        }, 3000);
      } catch (error: unknown) {
        setStatus("error");
        if (error && typeof error === "object" && "response" in error) {
          const axiosError = error as { response?: { data?: { error?: { message?: string } } } };
          setErrorMessage(axiosError.response?.data?.error?.message || "Verification failed");
        } else {
          setErrorMessage("Verification failed");
        }
      }
    };

    verifyEmail();
  }, [searchParams, navigate]);

  return (
    <PageIntro
      eyebrow={t("verifyEmail.eyebrow")}
      title={
        status === "verifying"
          ? t("verifyEmail.titleVerifying")
          : status === "success"
            ? t("verifyEmail.titleSuccess")
            : t("verifyEmail.titleFailed")
      }
      description={
        status === "verifying"
          ? t("verifyEmail.descVerifying")
          : status === "success"
            ? t("verifyEmail.descSuccess")
            : errorMessage || t("verifyEmail.descFailed")
      }
    >
      {status === "verifying" && (
        <div style={{ textAlign: "center", padding: "2rem 0" }}>
          <div
            style={{
              width: "48px",
              height: "48px",
              border: "4px solid rgba(79, 70, 229, 0.2)}",
              borderTopColor: "#4F46E5",
              borderRadius: "50%",
              margin: "0 auto",
              animation: "spin 1s linear infinite",
            }}
          />
          <style>{`
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      )}

      {status === "success" && (
        <div style={{ textAlign: "center", padding: "2rem 0" }}>
          <div
            style={{
              width: "64px",
              height: "64px",
              margin: "0 auto 1rem",
              borderRadius: "50%",
              backgroundColor: "rgba(34, 197, 94, 0.1)}",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#22c55e"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <Button
            onClick={() => navigate("/login")}
            style={{ marginTop: "1rem" }}
          >
            {t("verifyEmail.goToLogin")}
          </Button>
        </div>
      )}

      {status === "error" && (
        <div style={{ textAlign: "center", padding: "2rem 0" }}>
          <div
            style={{
              width: "64px",
              height: "64px",
              margin: "0 auto 1rem",
              borderRadius: "50%",
              backgroundColor: "rgba(239, 68, 68, 0.1)}",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#ef4444"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </div>
          <Button
            onClick={() => navigate("/register")}
            style={{ marginTop: "1rem" }}
          >
            {t("verifyEmail.backToRegister")}
          </Button>
        </div>
      )}
    </PageIntro>
  );
};

export default VerifyEmail;
