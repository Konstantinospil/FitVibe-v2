import { render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, expect, it, vi, beforeEach } from "vitest";
import Feed from "../../src/pages/Feed";
import * as api from "../../src/services/api";

// Mock the API module
vi.mock("../../src/services/api", async () => {
  const actual = await vi.importActual("../../src/services/api");
  return {
    ...actual,
    getFeed: vi.fn(),
    likeFeedItem: vi.fn(),
    unlikeFeedItem: vi.fn(),
    cloneSessionFromFeed: vi.fn(),
  };
});

const mockFeedData = {
  items: [
    {
      id: "feed-1",
      user: {
        id: "user-1",
        username: "athlete1",
        displayName: "John Doe",
      },
      session: {
        id: "session-1",
        title: "Morning Workout",
        notes: "Great session!",
        plannedAt: "2025-01-15T08:00:00Z",
        completedAt: "2025-01-15T09:30:00Z",
        exerciseCount: 5,
        totalVolume: 15000,
      },
      visibility: "public",
      createdAt: "2025-01-15T09:30:00Z",
      likesCount: 10,
      commentsCount: 2,
      isLiked: false,
    },
    {
      id: "feed-2",
      user: {
        id: "user-2",
        username: "athlete2",
        displayName: "Jane Smith",
      },
      session: {
        id: "session-2",
        title: "Evening Strength",
        notes: "Felt strong today",
        plannedAt: "2025-01-14T18:00:00Z",
        completedAt: "2025-01-14T19:30:00Z",
        exerciseCount: 4,
        totalVolume: 12000,
      },
      visibility: "private",
      createdAt: "2025-01-14T19:30:00Z",
      likesCount: 5,
      commentsCount: 1,
      isLiked: true,
    },
  ],
  total: 2,
};

describe("Feed visibility guards", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          gcTime: 0,
        },
      },
    });
    vi.mocked(api.getFeed).mockResolvedValue(mockFeedData);
  });

  const renderWithProvider = (ui: React.ReactElement) => {
    return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
  };

  it("disables session cloning when visibility is private", async () => {
    renderWithProvider(<Feed />);

    // Wait for feed items to load
    await waitFor(() => {
      expect(screen.getByText(/Morning Workout/i)).toBeInTheDocument();
    });

    // Get all clone/open session buttons (button text varies based on translations)
    const cloneButtons = screen.getAllByRole("button", { name: /clone|open session/i });

    // Filter to only secondary variant buttons (the clone buttons, not like buttons)
    const secondaryButtons = cloneButtons.filter((button) =>
      button.getAttribute("data-variant") === "secondary",
    );
    expect(secondaryButtons.length).toBe(2);

    // The second button (private session) should be disabled
    const privateCloneButton = secondaryButtons[1];
    expect(privateCloneButton).toBeDisabled();

    // The first button (public session) should not be disabled
    const publicCloneButton = secondaryButtons[0];
    expect(publicCloneButton).not.toBeDisabled();
  });
});
