import React from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const NAV_ITEMS = [
  { to: "/", label: "Home" },
  { to: "/dashboard", label: "Dashboard" },
  { to: "/planner", label: "Planner" },
  { to: "/logger", label: "Logger" },
  { to: "/progress", label: "Progress" },
  { to: "/feed", label: "Feed" },
  { to: "/profile", label: "Profile" },
];

const MainLayout: React.FC = () => {
  const { signOut } = useAuth();
  const navigate = useNavigate();

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
      <header
        style={{
          backdropFilter: "blur(12px)",
          background: "rgba(15, 23, 42, 0.55)",
          borderBottom: "1px solid rgba(148, 163, 184, 0.18)",
          position: "sticky",
          top: 0,
          zIndex: 10,
        }}
      >
        <nav
          aria-label="Primary navigation"
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
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            <span
              aria-hidden
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "14px",
                background: "linear-gradient(135deg, #34d399, #38bdf8)",
                display: "grid",
                placeItems: "center",
                boxShadow: "0 12px 30px -15px rgba(0,0,0,0.45)",
              }}
            >
              ⚡
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
                  fontSize: "0.95rem",
                  color: isActive ? "#0f172a" : "var(--color-text-secondary)",
                  background: isActive ? "var(--color-accent)" : "transparent",
                  fontWeight: isActive ? 600 : 500,
                  transition: "background 150ms ease, color 150ms ease",
                })}
                end={item.to === "/"}
              >
                {item.label}
              </NavLink>
            ))}
            <button
              type="button"
              onClick={handleSignOut}
              style={{
                marginLeft: "0.4rem",
                padding: "0.55rem 1.1rem",
                borderRadius: "999px",
                border: "1px solid rgba(148, 163, 184, 0.28)",
                background: "rgba(15, 23, 42, 0.2)",
                color: "var(--color-text-primary)",
                fontWeight: 600,
                letterSpacing: "0.02em",
              }}
            >
              Sign out
            </button>
          </div>
        </nav>
      </header>
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <Outlet />
      </div>
      <footer
        style={{
          padding: "2rem 0",
          textAlign: "center",
          fontSize: "0.85rem",
          color: "rgba(226, 232, 240, 0.7)",
        }}
      >
        Built for athletes who love data-driven progress ✦ FitVibe Labs
      </footer>
    </div>
  );
};

export default MainLayout;
