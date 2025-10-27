import React from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Avatar, Button } from "../components/ui";
import LanguageSwitcher from "../components/LanguageSwitcher";
import { useTranslation } from "react-i18next";

type NavItem = {
  to: string;
  labelKey: string;
};

const NAV_ITEMS: NavItem[] = [
  { to: "/", labelKey: "navigation.home" },
  { to: "/dashboard", labelKey: "navigation.dashboard" },
  { to: "/planner", labelKey: "navigation.planner" },
  { to: "/logger", labelKey: "navigation.logger" },
  { to: "/progress", labelKey: "navigation.progress" },
  { to: "/feed", labelKey: "navigation.feed" },
  { to: "/profile", labelKey: "navigation.profile" },
];

const MainLayout: React.FC = () => {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleSignOut = () => {
    signOut();
    navigate("/login", { replace: true });
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <a href="#main-content" className="skip-link">
        {t("navigation.skipToContent")}
      </a>
      <header
        style={{
          backdropFilter: "blur(14px)",
          background: "var(--color-surface)",
          borderBottom: "1px solid var(--color-border)",
          position: "sticky",
          top: 0,
          zIndex: 10,
        }}
      >
        <nav
          aria-label={t("navigation.home")}
          style={{
            maxWidth: "1100px",
            margin: "0 auto",
            padding: "1.15rem clamp(1rem, 5vw, 2.5rem)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "2rem",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              fontWeight: 600,
              letterSpacing: "var(--letter-spacing-wide)",
              textTransform: "uppercase",
              fontSize: "var(--font-size-sm)",
            }}
          >
            <span
              aria-hidden
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "14px",
                background: "linear-gradient(135deg, var(--color-accent), var(--color-highlight))",
                display: "grid",
                placeItems: "center",
                boxShadow: "0 12px 30px -15px rgba(0, 0, 0, 0.45)",
                fontFamily: "var(--font-family-heading)",
                fontWeight: 600,
                letterSpacing: "var(--letter-spacing-tight)",
              }}
            >
              FV
            </span>
            FitVibe
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.6rem",
              flexWrap: "wrap",
              justifyContent: "flex-end",
            }}
          >
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                style={({ isActive }) => ({
                  padding: "0.5rem 1rem",
                  borderRadius: "999px",
                  fontSize: "var(--font-size-sm)",
                  color: isActive ? "#0f172a" : "var(--color-text-secondary)",
                  background: isActive ? "var(--color-accent)" : "transparent",
                  fontWeight: isActive ? 600 : 500,
                  transition: "background 150ms ease, color 150ms ease",
                })}
                end={item.to === "/"}
              >
                {t(item.labelKey)}
              </NavLink>
            ))}
            <LanguageSwitcher />
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.6rem",
                marginLeft: "0.8rem",
              }}
            >
              <Avatar name={t("navigation.you") || "You"} size={40} status="online" />
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: "var(--font-size-sm)", fontWeight: 600 }}>
                  {t("navigation.you")}
                </div>
                <div style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-muted)" }}>
                  {t("navigation.activeSession")}
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={handleSignOut}>
                {t("navigation.signOut")}
              </Button>
            </div>
          </div>
        </nav>
      </header>
      <main id="main-content" style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <Outlet />
      </main>
      <footer
        style={{
          padding: "2rem 0",
          textAlign: "center",
          fontSize: "var(--font-size-xs)",
          color: "var(--color-text-muted)",
        }}
      >
        {t("footer.note")}
      </footer>
    </div>
  );
};

export default MainLayout;
