import { render, screen } from "@testing-library/react";
import { QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it } from "vitest";
import MainLayout from "../../src/layouts/MainLayout";
import { queryClient } from "../../src/lib/queryClient";
import { AuthProvider } from "../../src/contexts/AuthContext";

describe("MainLayout accessibility", () => {
  it("renders a skip navigation link", () => {
    render(
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <MemoryRouter initialEntries={["/"]}>
            <Routes>
              <Route element={<MainLayout />}>
                <Route index element={<div>Dashboard</div>} />
              </Route>
            </Routes>
          </MemoryRouter>
        </AuthProvider>
      </QueryClientProvider>,
    );

    const skipLink = screen.getByRole("link", { name: /skip to main content/i });
    expect(skipLink).toBeInTheDocument();
    expect(skipLink).toHaveClass("skip-link");
  });
});
