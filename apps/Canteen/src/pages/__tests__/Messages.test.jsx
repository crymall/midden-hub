import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useAuth } from "@shared/core/hooks/useAuth";
import * as canteenApi from "@shared/core/services/canteenApi";

import Messages from "../Messages";

vi.mock("@shared/core/services/canteenApi");
vi.mock("@shared/core/hooks/useAuth");

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock("@shared/ui/components/MiddenCard", () => ({
  default: ({ children, className }) => (
    <div className={className}>{children}</div>
  ),
}));

global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

describe("Messages", () => {
  const mockUser = { id: "iam1", canteenId: "1", username: "TestUser" };
  let queryClient;

  const mockThreads = [
    {
      other_user_id: "2",
      other_username: "Friend1",
      content: "Last message",
      created_at: new Date().toISOString(),
      sender_id: "2",
      is_read: false,
    },
    {
      other_user_id: "3",
      other_username: "Friend2",
      content: "Older message",
      created_at: new Date().toISOString(),
      sender_id: "1",
      is_read: true,
      recipe_id: "100",
    },
  ];

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    vi.clearAllMocks();
    mockNavigate.mockClear();

    useAuth.mockReturnValue({ user: mockUser });

    canteenApi.fetchThreads.mockResolvedValue(mockThreads);
    canteenApi.fetchFriends.mockResolvedValue([]);
  });

  const renderComponent = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <Messages />
        </MemoryRouter>
      </QueryClientProvider>,
    );
  };

  it("renders threads list", async () => {
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText("Messages")).toBeInTheDocument();
      expect(screen.getByText("Friend1")).toBeInTheDocument();
      expect(screen.getByText("Last message")).toBeInTheDocument();
      expect(canteenApi.fetchThreads).toHaveBeenCalled();
    });
  });

  it("renders thread with recipe share text", async () => {
    renderComponent();
    await waitFor(() => {
      expect(
        screen.getByText("You shared a recipe: Older message"),
      ).toBeInTheDocument();
    });
  });

  it("renders links to conversations", async () => {
    renderComponent();
    await waitFor(() => {
      const link = screen.getByText("Friend1").closest("a");
      expect(link).toHaveAttribute("href", "/messages/2");
    });
  });

  it("renders unread threads with unread indicators", async () => {
    renderComponent();
    await waitFor(() => {
      const friend1Link = screen.getByText("Friend1").closest("a");
      expect(friend1Link).toHaveClass("bg-accent/10");

      const friend2Link = screen.getByText("Friend2").closest("a");
      expect(friend2Link).not.toHaveClass("bg-accent/10");
    });
  });

  it("handles empty threads", async () => {
    canteenApi.fetchThreads.mockResolvedValue([]);
    renderComponent();
    await waitFor(() =>
      expect(screen.getByText("No conversations yet.")).toBeInTheDocument(),
    );
  });

  it("opens new message popover and searches friends", async () => {
    canteenApi.fetchThreads.mockResolvedValue([]);
    canteenApi.fetchFriends.mockResolvedValue([
      { id: "f1", username: "TestFriend" },
    ]);

    renderComponent();

    const newMsgBtn = screen.getByText("+ Message");
    await act(async () => {
      fireEvent.click(newMsgBtn);
    });

    const input = screen.getByPlaceholderText("Search friends...");
    await waitFor(() => {
      expect(input).toBeInTheDocument();
      expect(canteenApi.fetchFriends).toHaveBeenCalledWith("1", 50, 0, "");
    });

    await act(async () => {
      fireEvent.change(input, { target: { value: "Test" } });
    });

    await waitFor(() => {
      expect(canteenApi.fetchFriends).toHaveBeenCalledWith("1", 50, 0, "Test");
    });
  });

  it("navigates to conversation when friend is selected in new message popover", async () => {
    canteenApi.fetchThreads.mockResolvedValue([]);
    canteenApi.fetchFriends.mockResolvedValue([
      { id: "f1", username: "TestFriend" },
    ]);

    renderComponent();
    await act(async () => {
      fireEvent.click(screen.getByText("+ Message"));
    });

    const input = screen.getByPlaceholderText("Search friends...");
    await act(async () => {
      fireEvent.change(input, { target: { value: "Test" } });
    });

    await waitFor(() => {
      expect(screen.getByText("TestFriend")).toBeInTheDocument();
    });
    await act(async () => {
      fireEvent.keyDown(input, { key: "Enter", code: "Enter" });
    });

    expect(mockNavigate).toHaveBeenCalledWith("/messages/f1");
  });
});
