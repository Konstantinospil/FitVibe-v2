import React from "react";
import PageIntro from "../components/PageIntro";
import { NavLink } from "react-router-dom";

const NotFound: React.FC = () => (
  <PageIntro
    eyebrow="Navigation"
    title="We couldn't find that page."
    description="The route you requested is either private or still under construction. Head back to the dashboard or talk to the team if you need early access."
  >
    <div
      style={{
        display: "flex",
        gap: "1rem",
        flexWrap: "wrap",
      }}
    >
      <NavLink
        to="/dashboard"
        style={{
          padding: "0.9rem 1.4rem",
          borderRadius: "999px",
          background: "var(--color-accent)",
          color: "#0f172a",
          fontWeight: 600,
          letterSpacing: "0.02em",
        }}
      >
        Take me home
      </NavLink>
      <NavLink
        to="/"
        style={{
          padding: "0.9rem 1.4rem",
          borderRadius: "999px",
          background: "rgba(15, 23, 42, 0.4)",
          border: "1px solid rgba(148, 163, 184, 0.2)",
          color: "var(--color-text-secondary)",
          fontWeight: 600,
          letterSpacing: "0.02em",
        }}
      >
        Go to landing
      </NavLink>
    </div>
  </PageIntro>
);

export default NotFound;
