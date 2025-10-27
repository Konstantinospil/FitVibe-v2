import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import "../../src/styles/global.css";
import { CardTitle } from "../../src/components/ui";

describe("Design tokens", () => {
  it("exposes core font and color custom properties", () => {
    const rootStyle = getComputedStyle(document.documentElement);
    expect(rootStyle.getPropertyValue("--font-family-base").trim()).not.toBe("");
    expect(rootStyle.getPropertyValue("--color-accent").trim()).toBe("#34d399");
    expect(rootStyle.getPropertyValue("--font-size-lg").trim()).toBe("1.125rem");
  });

  it("applies heading font family in CardTitle", () => {
    render(<CardTitle>Typography Check</CardTitle>);
    const heading = screen.getByText("Typography Check");
    expect(heading.style.fontFamily).toBe("var(--font-family-heading)");
  });
});
