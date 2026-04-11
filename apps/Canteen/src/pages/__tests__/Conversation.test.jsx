import { MemoryRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useAuth } from "@shared/core/hooks/useAuth";
import * as canteenApi from "@shared/core/services/canteenApi";

import Conversation from "../Conversation";

vi.mock("@shared/core/services/canteenApi");
vi.mock("@shared/core/hooks/useAuth");

vi.mock("@shared/ui/components/MiddenCard", () => ({
  default: ({ children, className }) => <div className={className}>{children}</div>,
}));

vi.mock("../../components/RecipeCard", () => ({
  default: ({ recipe, inverse }) => (
    <div data-testid="recipe-card" data-inverse={String(inverse)}>
      {recipe.title}
    </div>
  ),
}));

global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

describe("Conversation", () => {
  const defaultUser = { id: "iam1", canteenId: "1", username: "TestUser" };
  const mockConversation = [
    {
      id: 1,
      sender_id: "2",
      receiver_id: "1",
      content: "Hello",
      created_at: "2023-01-01T10:00:00.000Z",
      is_read: false,
    },
    {
      id: 2,
      sender_id: "1",
      receiver_id: "2",
      content: "Hi back",
      created_at: "2023-01-01T10:05:00.000Z",
      is_read: true,
      recipe: {
        id: "100",
        title: "Test Recipe",
        description: "Test Description",
        tags: [],
        likes: [],
      },
      recipe_id: "100",
    },
  ];

  let queryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    useAuth.mockReturnValue({ user: defaultUser });

    canteenApi.fetchUser.mockResolvedValue({ id: "2", username: "Friend1" });
    canteenApi.fetchConversation.mockResolvedValue(mockConversation);
    canteenApi.fetchRecipes.mockResolvedValue([
      { id: "100", title: "Test Recipe", tags: [], likes: [] },
    ]);
    canteenApi.sendMessage.mockResolvedValue({});
    canteenApi.markMessagesAsRead.mockResolvedValue({});
  });

  const renderComponent = async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={["/messages/2"]}>
          <Routes>
            <Route path="/messages/:id" element={<Conversation />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );
    await screen.findByText("Friend1");
  };

  it("renders conversation", async () => {
    await renderComponent();
    expect(canteenApi.fetchConversation).toHaveBeenCalledWith("2");
    expect(canteenApi.fetchUser).toHaveBeenCalledWith("2");
    expect(screen.getByText("Hello")).toBeInTheDocument();
    expect(screen.getByText("Hi back")).toBeInTheDocument();
    const recipeCard = screen.getByTestId("recipe-card");
    expect(recipeCard).toHaveTextContent("Test Recipe");
    expect(recipeCard).toHaveAttribute("data-inverse", "true");
  });

  it("sends a message", async () => {
    await renderComponent();

    const input = screen.getByPlaceholderText("Type a message...");
    fireEvent.change(input, { target: { value: "New message" } });

    const sendButton = screen.getByText("Send");
    await act(async () => {
      fireEvent.click(sendButton);
    });

    expect(canteenApi.sendMessage).toHaveBeenCalledWith("2", "New message");
    expect(input.value).toBe("");
  });

  it("shows loading state", async () => {
    canteenApi.fetchConversation.mockImplementation(() => new Promise(() => {})); // Hang to simulate loading
    await renderComponent();
    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("marks unread messages sent to the user as read", async () => {
    await renderComponent();
    await waitFor(() => {
      expect(canteenApi.markMessagesAsRead).toHaveBeenCalledWith([1]);
    });
  });

  it("sends a message via Enter key", async () => {
    await renderComponent();
    const input = screen.getByPlaceholderText("Type a message...");

    await act(async () => {
      fireEvent.change(input, { target: { value: "Enter message" } });
      fireEvent.keyDown(input, {
        key: "Enter",
        code: "Enter",
        shiftKey: false,
      });
    });

    expect(canteenApi.sendMessage).toHaveBeenCalledWith("2", "Enter message");
  });

  it("does not send a message via Shift+Enter", async () => {
    await renderComponent();
    const input = screen.getByPlaceholderText("Type a message...");

    await act(async () => {
      fireEvent.change(input, { target: { value: "Multiline\nmessage" } });
      fireEvent.keyDown(input, { key: "Enter", code: "Enter", shiftKey: true });
    });

    expect(canteenApi.sendMessage).not.toHaveBeenCalled();
  });

  it("disables the send button when the message is empty", async () => {
    await renderComponent();
    const sendButton = screen.getByText("Send");
    expect(sendButton).toBeDisabled();
  });

  it("formats dates correctly", async () => {
    await renderComponent();
    const date1 = new Date("2023-01-01T10:00:00.000Z");
    const formattedStr =
      date1.toLocaleDateString() +
      " " +
      date1.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    await waitFor(() => expect(screen.getAllByText(formattedStr).length).toBeGreaterThan(0));
  });

  it("logs error if sending message fails", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    canteenApi.sendMessage.mockRejectedValue(new Error("Send failed"));

    await renderComponent();

    const input = screen.getByPlaceholderText("Type a message...");
    fireEvent.change(input, { target: { value: "Failing message" } });

    const sendButton = screen.getByText("Send");
    await act(async () => {
      fireEvent.click(sendButton);
    });

    expect(consoleSpy).toHaveBeenCalledWith("Failed to send message", expect.any(Error));
    consoleSpy.mockRestore();
  });
});
