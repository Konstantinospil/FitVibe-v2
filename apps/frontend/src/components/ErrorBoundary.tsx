import React, { Component, type ReactNode } from "react";
import { withTranslation, type WithTranslation } from "react-i18next";

interface Props extends WithTranslation {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundaryComponent extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div
          style={{
            padding: "2rem",
            textAlign: "center",
            color: "var(--color-text-secondary)",
            background: "rgba(248, 113, 113, 0.1)",
            borderRadius: "12px",
            border: "1px solid rgba(248, 113, 113, 0.3)",
          }}
        >
          <strong style={{ display: "block", marginBottom: "0.5rem", color: "rgb(248, 113, 113)" }}>
            {this.props.t("components.errorBoundary.title")}
          </strong>
          <p style={{ margin: 0, fontSize: "0.9rem" }}>
            {this.state.error?.message || this.props.t("components.errorBoundary.message")}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            style={{
              marginTop: "1rem",
              padding: "0.5rem 1rem",
              borderRadius: "8px",
              border: "1px solid var(--color-border)",
              background: "var(--color-surface-glass)",
              color: "var(--color-text-primary)",
              cursor: "pointer",
            }}
          >
            {this.props.t("components.errorBoundary.tryAgain")}
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export const ErrorBoundary = withTranslation()(ErrorBoundaryComponent);
export default ErrorBoundary;
