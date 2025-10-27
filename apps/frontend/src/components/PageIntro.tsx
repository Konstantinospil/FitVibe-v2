import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui";

interface PageIntroProps {
  eyebrow: string;
  title: string;
  description: string;
  children?: React.ReactNode;
}

const eyebrowStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "0.6rem",
  fontSize: "0.9rem",
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  fontWeight: 600,
  color: "var(--color-text-secondary)",
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
    <Card
      as="article"
      style={{
        maxWidth: "900px",
        width: "100%",
        padding: "0",
        gap: "0",
      }}
    >
      <CardHeader
        style={{
          padding: "3rem clamp(1.5rem, 5vw, 3.5rem) 1.5rem",
          gap: "1rem",
        }}
      >
        <span style={eyebrowStyle}>
          <span style={{ width: "24px", height: "2px", background: "var(--color-accent)" }} />
          {eyebrow}
        </span>
        <CardTitle
          style={{
            fontSize: "clamp(2rem, 4vw, 2.8rem)",
            lineHeight: 1.15,
            letterSpacing: "-0.015em",
          }}
        >
          {title}
        </CardTitle>
        <CardDescription
          style={{
            fontSize: "1rem",
            lineHeight: 1.6,
          }}
        >
          {description}
        </CardDescription>
      </CardHeader>
      {children ? (
        <CardContent
          style={{
            padding: "0 3rem 3rem",
            gap: "1.5rem",
          }}
        >
          {children}
        </CardContent>
      ) : null}
    </Card>
  </section>
);

export default PageIntro;
