import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import ShareLinkManager from "../../src/components/ShareLinkManager";

describe("ShareLinkManager", () => {
  beforeEach(() => {
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });
  });

  it("creates a new share link", () => {
    render(<ShareLinkManager />);

    fireEvent.click(screen.getByRole("button", { name: /create share link/i }));

    const links = screen.getAllByText(/https:\/\/fitvibe.app\/share\//i);
    expect(links.length).toBeGreaterThan(0);
  });

  it("copies a link to the clipboard", async () => {
    render(<ShareLinkManager />);

    fireEvent.click(screen.getByRole("button", { name: /create share link/i }));

    const copyButton = screen.getByRole("button", { name: /copy link/i });
    fireEvent.click(copyButton);

    await waitFor(() => expect(navigator.clipboard.writeText).toHaveBeenCalledTimes(1));
    expect(screen.getByRole("button", { name: /link copied to clipboard/i })).toBeEnabled();
  });

  it("revokes a link and disables copy", () => {
    render(<ShareLinkManager />);

    fireEvent.click(screen.getByRole("button", { name: /create share link/i }));

    const revokeButton = screen.getByRole("button", { name: /revoke/i });
    fireEvent.click(revokeButton);

    expect(screen.getByText(/this link is no longer accessible/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /copy link/i })).toBeDisabled();
  });
});
