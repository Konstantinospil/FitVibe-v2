import React from "react";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary";
};

export const Button: React.FC<ButtonProps> = ({ variant = "primary", children, ...rest }) => (
  <button
    {...rest}
    style={{
      padding: "0.5rem 1rem",
      backgroundColor: variant === "primary" ? "#1e90ff" : "#ddd",
      border: "none",
      borderRadius: 8,
      color: variant === "primary" ? "#fff" : "#333",
      cursor: "pointer",
    }}
  >
    {children}
  </button>
);