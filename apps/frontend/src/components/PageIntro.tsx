import React from "react";

interface PageIntroProps {
  eyebrow: string;
  title: string;
  description: string;
  children?: React.ReactNode;
}

const containerStyle: React.CSSProperties = {
  maxWidth: "900px",
  width: "100%",
  margin: "0 auto",
  backgroundColor: "var(--color-bg-card)",
  borderRadius: "28px",
  padding: "3rem clamp(1.5rem, 5vw, 3.5rem)",
  boxShadow: "var(--shadow-elevated)",
  border: "1px solid var(--color-border)",
  backdropFilter: "blur(10px)",
  display: "grid",
  gap: "1.75rem",
};

const PageIntro: React.FC<PageIntroProps> = ({ eyebrow, title, description, children }) => (
  <section
    style={{
      flex: 1,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "5rem 1.5rem",
    }}
  >
    <div style={containerStyle}>
      <header style={{ display: "grid", gap: "1rem" }}>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.6rem",
            fontSize: "0.9rem",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            fontWeight: 600,
            color: "var(--color-text-secondary)",
          }}
        >
          <span style={{ width: "24px", height: "2px", background: "var(--color-accent)" }} />
          {eyebrow}
        </span>
        <h1
          style={{
            margin: 0,
            fontSize: "clamp(2rem, 4vw, 2.8rem)",
            lineHeight: 1.15,
            letterSpacing: "-0.015em",
          }}
        >
          {title}
        </h1>
        <p
          style={{
            margin: 0,
            color: "var(--color-text-secondary)",
            fontSize: "1rem",
            lineHeight: 1.6,
          }}
        >
          {description}
        </p>
      </header>
      {children}
    </div>
  </section>
);

export default PageIntro;
