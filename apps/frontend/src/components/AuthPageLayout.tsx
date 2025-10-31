import React from "react";
import ThemeToggle from "./ThemeToggle";
import LanguageSwitcher from "./LanguageSwitcher";
import PageIntro from "./PageIntro";

interface AuthPageLayoutProps {
  eyebrow: string;
  title: string;
  description: string;
  children?: React.ReactNode;
}

const AuthPageLayout: React.FC<AuthPageLayoutProps> = ({ eyebrow, title, description, children }) => {
  return (
    <div style={{ position: "relative", minHeight: "100vh" }}>
      <div
        style={{
          position: "absolute",
          top: "1.5rem",
          right: "1.5rem",
          display: "flex",
          alignItems: "center",
          gap: "0.6rem",
          zIndex: 10,
        }}
      >
        <ThemeToggle />
        <LanguageSwitcher />
      </div>
      <PageIntro eyebrow={eyebrow} title={title} description={description}>
        {children}
      </PageIntro>
    </div>
  );
};

export default AuthPageLayout;
