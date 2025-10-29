import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Button } from "../../src/components/ui";

describe("Button", () => {
  it("renders children and triggers click handler", () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Continue</Button>);

    const button = screen.getByRole("button", { name: /continue/i });
    fireEvent.click(button);

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("applies the secondary variant styles", () => {
    render(
      <Button variant="secondary" data-testid="secondary-button">
        Secondary
      </Button>,
    );

    const button = screen.getByTestId("secondary-button");
    expect(button).toHaveStyle({ background: "var(--color-surface)" });
    expect(button).toHaveAttribute("data-variant", "secondary");
  });

  it("disables the button and shows loader when isLoading is true", () => {
    render(
      <Button isLoading data-testid="loading-button">
        Loading
      </Button>,
    );

    const button = screen.getByTestId("loading-button");
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("aria-busy", "true");
    expect(button).toHaveAttribute("aria-disabled", "true");
    expect(button.querySelector("[aria-hidden='true']")).toBeTruthy();
  });
});
