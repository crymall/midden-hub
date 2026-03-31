import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import ShareRecipePopover from "../ShareRecipePopover";
import useData from "@shared/core/context/data/useData";
import useAuth from "@shared/core/context/auth/useAuth";

vi.mock("@shared/core/context/data/useData");
vi.mock("@shared/core/context/auth/useAuth");
vi.mock("@shared/ui/components/MiddenModal", () => ({
  default: ({ isOpen, children, title }) =>
    isOpen ? (
      <div data-testid="midden-modal">
        <h2>{title}</h2>
        {children}
      </div>
    ) : null,
}));

global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

describe("ShareRecipePopover", () => {
  const mockGetFriends = vi.fn();
  const mockSendMessage = vi.fn();
  const mockUser = { id: "user123" };
  const mockRecipe = {
    id: "recipe456",
    title: "Spicy Noodles",
    description: "Very spicy, very good.",
  };
  const mockFriends = [
    { id: "friend1", username: "Alice" },
    { id: "friend2", username: "Bob" },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    useAuth.mockReturnValue({ user: mockUser });
    useData.mockReturnValue({
      friends: mockFriends,
      getFriends: mockGetFriends,
      sendMessage: mockSendMessage,
    });

    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });
  });

  const renderComponent = (props = {}) => {
    return render(<ShareRecipePopover recipe={mockRecipe} label="Share" {...props} />);
  };

  it("renders the share button", () => {
    renderComponent();
    expect(screen.getByText("Share")).toBeInTheDocument();
  });

  describe("Popover Behavior", () => {
    it("fetches friends on hover and click, but only executes once", async () => {
      renderComponent();
      const button = screen.getByText("Share");
      
      await act(async () => {
        fireEvent.mouseEnter(button);
        fireEvent.click(button);
      });
      
      expect(mockGetFriends).toHaveBeenCalledWith("user123");
      expect(mockGetFriends).toHaveBeenCalledTimes(1);
    });

    it("opens popover, copies link, and displays copied state", async () => {
      renderComponent();
      const button = screen.getByText("Share");
      await act(async () => {
        fireEvent.click(button);
      });

      expect(screen.getByTitle("Copy Link")).toBeInTheDocument();
      expect(screen.getByText("🔗")).toBeInTheDocument();

      const copyButton = screen.getByTitle("Copy Link");
      await act(async () => {
        fireEvent.click(copyButton);
      });

      const expectedUrl = `http://localhost:3000/recipes/${mockRecipe.id}`;
      const expectedText = `${mockRecipe.title} recipe\n${expectedUrl}`;
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(expectedText);

      await waitFor(() => {
        expect(screen.getByText("✅")).toBeInTheDocument();
      });
    });

    it("displays and filters a list of friends based on search query", async () => {
      renderComponent();
      const button = screen.getByText("Share");
      await act(async () => {
        fireEvent.click(button);
      });

      const searchInput = screen.getByPlaceholderText("Search friends...");
      await act(async () => {
        fireEvent.change(searchInput, { target: { value: "ali" } });
      });

      await waitFor(() => {
        expect(screen.getByText("Alice")).toBeInTheDocument();
      });
      expect(screen.queryByText("Bob")).not.toBeInTheDocument();
    });

    it("shows 'no friends found' message", async () => {
      renderComponent();
      const button = screen.getByText("Share");
      await act(async () => {
        fireEvent.click(button);
      });

      const searchInput = screen.getByPlaceholderText("Search friends...");
      await act(async () => {
        fireEvent.change(searchInput, { target: { value: "xyz" } });
      });

      await waitFor(() => {
        expect(screen.getByText("No friends found.")).toBeInTheDocument();
      });
    });
  });

  describe("Sharing Modal Interaction", () => {
    it("opens modal on friend selection, sends message, and closes", async () => {
      mockSendMessage.mockResolvedValue({});
      renderComponent();

      const button = screen.getByText("Share");
      await act(async () => {
        fireEvent.click(button);
      });

      const searchInput = screen.getByPlaceholderText("Search friends...");
      await act(async () => {
        fireEvent.change(searchInput, { target: { value: "Alice" } });
      });

      await waitFor(() => {
        expect(screen.getByText("Alice")).toBeInTheDocument();
      });

      await act(async () => {
        fireEvent.keyDown(searchInput, { key: "Enter", code: "Enter" });
      });

      await waitFor(() => {
        expect(screen.getByTestId("midden-modal")).toBeInTheDocument();
      });
      expect(screen.getByText(`Share with Alice`)).toBeInTheDocument();

      const messageInput = screen.getByPlaceholderText("Check out this recipe!");
      await act(async () => {
        fireEvent.change(messageInput, { target: { value: "You should try this!" } });
      });

      const sendButton = screen.getByText("Send");
      await act(async () => {
        fireEvent.click(sendButton);
      });

      await waitFor(() => {
        expect(mockSendMessage).toHaveBeenCalledWith(
          "friend1",
          "You should try this!",
          "recipe456"
        );
      });

      await waitFor(() => {
        expect(screen.queryByTestId("midden-modal")).not.toBeInTheDocument();
      });
    });
  });
});