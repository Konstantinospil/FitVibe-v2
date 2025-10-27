import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Dashboard from "../../src/pages/Dashboard";

describe("Dashboard analytics", () => {
  it("limits aggregate rows to five entries", () => {
    render(<Dashboard />);

    const rows = screen.getAllByRole("row").slice(1); // exclude header
    expect(rows.length).toBeLessThanOrEqual(5);
  });

  it("updates aggregates when selecting a different range", async () => {
    render(<Dashboard />);

    fireEvent.change(screen.getByLabelText(/select range/i), { target: { value: "8w" } });

    await waitFor(() => expect(screen.getByText(/range: last 8 weeks/i)).toBeInTheDocument());
  });

  it("switches grain using toggle buttons", () => {
    render(<Dashboard />);

    fireEvent.click(screen.getByRole("button", { name: /monthly/i }));

    expect(screen.getByText(/august/i)).toBeInTheDocument();
  });
});
