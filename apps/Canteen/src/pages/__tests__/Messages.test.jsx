import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { MemoryRouter } from "react-router-dom";
import Messages from "../Messages";
import useData from "@shared/core/context/data/useData";
import useAuth from "@shared/core/context/auth/useAuth";

vi.mock("@shared/core/context/data/useData");
vi.mock("@shared/core/context/auth/useAuth");

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock("@shared/ui/components/MiddenCard", () => ({
  default: ({ children, className }) => <div className={className}>{children}</div>,
}));

global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

describe("Messages", () => {
  const mockGetThreads = vi.fn();

  const mockUser = { id: "1", username: "TestUser" };

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
    vi.clearAllMocks();
    mockNavigate.mockClear();

    useAuth.mockReturnValue({ user: mockUser });
    useData.mockReturnValue({
      threads: mockThreads,
      getThreads: mockGetThreads,
      friends: [],
      getFriends: vi.fn(),
    });
  });

  const renderComponent = () => {
    return render(
      <MemoryRouter>
        <Messages />
      </MemoryRouter>
    );
  };

  it("renders threads list", () => {
    renderComponent();
    expect(screen.getByText("Messages")).toBeInTheDocument();
    expect(screen.getByText("Friend1")).toBeInTheDocument();
    expect(screen.getByText("Last message")).toBeInTheDocument();
    expect(mockGetThreads).toHaveBeenCalled();
  });

  it("renders thread with recipe share text", () => {
    renderComponent();
    expect(screen.getByText("You shared a recipe: Older message")).toBeInTheDocument();
  });

  it("renders links to conversations", () => {
    renderComponent();
    const link = screen.getByText("Friend1").closest("a");
    expect(link).toHaveAttribute("href", "/messages/2");
  });

  it("renders unread threads with unread indicators", () => {
    renderComponent();
    const friend1Link = screen.getByText("Friend1").closest("a");
    expect(friend1Link).toHaveClass("bg-accent/10");
    
    const friend2Link = screen.getByText("Friend2").closest("a");
    expect(friend2Link).not.toHaveClass("bg-accent/10");
  });

  it("handles empty threads", () => {
    useData.mockReturnValue({
      ...useData(),
      threads: [],
    });
    renderComponent();
    expect(screen.getByText("No conversations yet.")).toBeInTheDocument();
  });

  it("opens new message popover and searches friends", async () => {
    const mockGetFriends = vi.fn();
    useData.mockReturnValue({
      threads: [],
      getThreads: vi.fn(),
      friends: [{ id: "f1", username: "TestFriend" }],
      getFriends: mockGetFriends,
    });

    renderComponent();

    const newMsgBtn = screen.getByText("+ Message");
    await act(async () => {
      fireEvent.click(newMsgBtn);
    });

    const input = screen.getByPlaceholderText("Search friends...");
    expect(input).toBeInTheDocument();
    expect(mockGetFriends).toHaveBeenCalledWith("1", 50, 0, "");

    await act(async () => {
      fireEvent.change(input, { target: { value: "Test" } });
    });

    expect(mockGetFriends).toHaveBeenCalledWith("1", 50, 0, "Test");
  });

  it("navigates to conversation when friend is selected in new message popover", async () => {
    useData.mockReturnValue({
      threads: [],
      getThreads: vi.fn(),
      friends: [{ id: "f1", username: "TestFriend" }],
      getFriends: vi.fn(),
    });

    renderComponent();
    await act(async () => { fireEvent.click(screen.getByText("+ Message")); });
    
    const input = screen.getByPlaceholderText("Search friends...");
    await act(async () => {
      fireEvent.change(input, { target: { value: "Test" } });
    });

    await waitFor(() => {
      expect(screen.getByText("TestFriend")).toBeInTheDocument();
    });
    await act(async () => { fireEvent.keyDown(input, { key: "Enter", code: "Enter" }); });

    expect(mockNavigate).toHaveBeenCalledWith("/messages/f1");
  });
});