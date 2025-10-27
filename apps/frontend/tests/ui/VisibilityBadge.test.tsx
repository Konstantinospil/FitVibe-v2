import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { VisibilityBadge } from "../../src/components/ui";

describe("VisibilityBadge", () => {
  it("renders translated label for each level", () => {
    render(
      <div>
        <VisibilityBadge level="private" />
        <VisibilityBadge level="link" />
        <VisibilityBadge level="public" />
      </div>,
    );

    expect(screen.getByText(/Private/i)).toBeInTheDocument();
    expect(screen.getByText(/Link-only/i)).toBeInTheDocument();
    expect(screen.getByText(/Public/i)).toBeInTheDocument();
  });
});
