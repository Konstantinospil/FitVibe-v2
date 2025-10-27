import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Feed from "../../src/pages/Feed";

describe("Feed visibility guards", () => {
  it("disables session access when visibility is private", () => {
    render(<Feed />);

    const guard = screen.getByText(/Only you can open this session\./i);
    expect(guard).toBeInTheDocument();

    const buttons = screen.getAllByRole("button", { name: /Open session/i });
    const privateButton = buttons.at(-1);
    expect(privateButton).toBeDisabled();
  });
});
