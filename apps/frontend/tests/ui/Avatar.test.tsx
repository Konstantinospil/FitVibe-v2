import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Avatar } from "../../src/components/ui";

describe("Avatar", () => {
  it("renders initials when no image source is provided", () => {
    render(<Avatar name="Jamie Vardy" />);

    expect(screen.getByText("JV")).toBeVisible();
  });

  it("renders status indicator when status is provided", () => {
    render(<Avatar name="Jamie Vardy" status="online" />);

    const avatar = screen.getByLabelText("Jamie Vardy");
    const statusIndicator = avatar.querySelector("span[aria-hidden='true']");
    expect(statusIndicator).toBeTruthy();
  });
});
