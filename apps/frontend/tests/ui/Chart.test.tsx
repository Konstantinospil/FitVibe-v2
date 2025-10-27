import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";

vi.mock("recharts", () => {
  return {
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="responsive-container">{children}</div>
    ),
    AreaChart: ({ children, data }: { children: React.ReactNode; data: unknown[] }) => (
      <svg data-testid="area-chart" data-data-length={Array.isArray(data) ? data.length : 0}>
        {children}
      </svg>
    ),
    BarChart: ({ children, data }: { children: React.ReactNode; data: unknown[] }) => (
      <svg data-testid="bar-chart" data-data-length={Array.isArray(data) ? data.length : 0}>
        {children}
      </svg>
    ),
    Area: () => <div data-testid="area-series" />,
    Bar: () => <div data-testid="bar-series" />,
    CartesianGrid: () => null,
    Tooltip: () => null,
    XAxis: () => null,
    YAxis: () => null,
  };
});

import { Chart } from "../../src/components/ui";

const sampleData = [
  { label: "Mon", value: 50 },
  { label: "Tue", value: 55 },
  { label: "Wed", value: 60 },
];

describe("Chart", () => {
  it("renders area chart with provided data", () => {
    render(<Chart data={sampleData} />);

    expect(screen.getByTestId("responsive-container")).toBeInTheDocument();
    expect(screen.getByTestId("area-chart")).toHaveAttribute("data-data-length", "3");
    expect(screen.getByTestId("area-series")).toBeInTheDocument();
  });

  it("renders bar chart when type is bar", () => {
    render(<Chart data={sampleData} type="bar" />);

    expect(screen.getByTestId("bar-chart")).toBeInTheDocument();
    expect(screen.getByTestId("bar-chart")).toHaveAttribute("data-data-length", "3");
    expect(screen.getByTestId("bar-series")).toBeInTheDocument();
  });
});
