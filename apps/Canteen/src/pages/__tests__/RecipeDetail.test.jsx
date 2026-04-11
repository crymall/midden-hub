import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useAuth } from "@shared/core/hooks/useAuth";
import * as canteenApi from "@shared/core/services/canteenApi";

import RecipeDetail from "../RecipeDetail";

vi.mock("@shared/core/services/canteenApi");
const mockNavigate = vi.fn();
let mockLocation = { key: "default" };

vi.mock("react-router-dom", () => ({
  useParams: () => ({ id: "123" }),
  Link: ({ to, children, state }) => (
    <a href={to} data-state={state ? JSON.stringify(state) : null}>
      {children}
    </a>
  ),
  useNavigate: () => mockNavigate,
  useLocation: () => mockLocation,
}));

vi.mock("@shared/core/hooks/useAuth");

vi.mock("@shared/ui/components/MiddenCard", () => ({
  default: ({ children }) => <div data-testid="midden-card">{children}</div>,
}));

vi.mock("@shared/core/gateways/Can", () => ({
  default: ({ children }) => <div data-testid="can-gate">{children}</div>,
}));

vi.mock("../../components/ListAddPopover", () => ({
  default: ({ recipeId, label }) => (
    <button data-testid="list-add-popover" data-recipe-id={recipeId}>
      {label}
    </button>
  ),
}));

vi.mock("../../components/ShareRecipePopover", () => ({
  default: ({ recipe, label }) => (
    <button data-testid="share-recipe-popover" data-recipe-id={recipe.id}>
      {label}
    </button>
  ),
}));

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

describe("RecipeDetail", () => {
  const mockRecipe = {
    id: "123",
    title: "Test Recipe",
    author: { id: "u1", username: "chef_test" },
    description: "A tasty test recipe",
    prep_time_minutes: 10,
    cook_time_minutes: 20,
    wait_time_minutes: 30,
    total_time_minutes: 60,
    servings: 4,
    ingredients: [{ quantity: "1", unit: "cup", name: "Flour", notes: "sifted" }],
    instructions: "Mix and bake.",
    likes: [],
    tags: [{ id: "1", name: "TestTag" }],
  };

  const mockUser = { id: "iam1", canteenId: "user1", username: "testuser" };

  let queryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    mockLocation = { key: "default" };
    mockNavigate.mockClear();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    useAuth.mockReturnValue({ user: mockUser });
    canteenApi.fetchRecipe.mockResolvedValue(mockRecipe);
  });

  const renderComponent = () =>
    render(
      <QueryClientProvider client={queryClient}>
        <RecipeDetail />
      </QueryClientProvider>,
    );

  it("fetches recipe on mount", async () => {
    renderComponent();

    await act(async () => {
      await waitFor(() => expect(canteenApi.fetchRecipe).toHaveBeenCalledWith("123"));
    });
  });

  it("renders loading state", async () => {
    canteenApi.fetchRecipe.mockImplementation(() => new Promise(() => {})); // hang forever
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText(/Loading recipe.../i)).toBeInTheDocument();
    });
  });

  it("renders not found state", async () => {
    canteenApi.fetchRecipe.mockResolvedValue(null);
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText(/Recipe not found/i)).toBeInTheDocument();
    });
  });

  it("renders recipe details correctly", async () => {
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText("Test Recipe")).toBeInTheDocument();
      expect(screen.getByText("chef_test")).toBeInTheDocument();
      expect(screen.getByText("A tasty test recipe")).toBeInTheDocument();
      expect(screen.getByText("10m")).toBeInTheDocument();
      expect(screen.getByText("20m")).toBeInTheDocument();
      expect(screen.getByText("1h")).toBeInTheDocument();
      expect(screen.getByText("4")).toBeInTheDocument();
      expect(screen.getByText("Flour")).toBeInTheDocument();
      expect(screen.getByText("Mix and bake.")).toBeInTheDocument();
      expect(screen.getByText("TestTag")).toBeInTheDocument();
    });
  });

  it("renders author link correctly", async () => {
    renderComponent();
    await waitFor(() => {
      const authorLink = screen.getByText("chef_test").closest("a");
      expect(authorLink).toHaveAttribute("href", "/user/u1");
    });
  });

  it("formats time correctly for over 60 minutes", async () => {
    canteenApi.fetchRecipe.mockResolvedValue({
      ...mockRecipe,
      prep_time_minutes: 125,
    });
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText("2h05m")).toBeInTheDocument();
    });
  });

  it("handles like toggle", async () => {
    canteenApi.likeRecipe.mockResolvedValue({});
    renderComponent();
    const likeBtn = await screen.findByRole("button", { name: /♡\s*Like/i });
    await act(async () => {
      fireEvent.click(likeBtn);
    });
    expect(canteenApi.likeRecipe).toHaveBeenCalledWith("123");
  });

  it("renders edit and delete buttons in popover for owner", async () => {
    useAuth.mockReturnValue({
      user: { id: "iam1", canteenId: "u1", username: "chef_test" },
    });
    renderComponent();

    const optionsBtn = await screen.findByRole("button", { name: "Options" });
    await act(async () => {
      fireEvent.click(optionsBtn);
    });

    await waitFor(() => {
      expect(screen.getByText("Edit")).toBeInTheDocument();
      const editLink = screen.getByText("Edit").closest("a");
      expect(editLink).toHaveAttribute("data-state", JSON.stringify({ fromDetail: true }));
      expect(screen.getByText("Delete")).toBeInTheDocument();
    });
  });

  it("does not render options popover for non-owner", async () => {
    useAuth.mockReturnValue({
      user: { id: "iam1", canteenId: "user1", username: "testuser" },
    });
    renderComponent();

    await screen.findByText("Test Recipe");
    expect(screen.queryByRole("button", { name: "Options" })).not.toBeInTheDocument();
    expect(screen.queryByText("Edit")).not.toBeInTheDocument();
    expect(screen.queryByText("Delete")).not.toBeInTheDocument();
  });

  it("handles recipe deletion", async () => {
    useAuth.mockReturnValue({
      user: { id: "iam1", canteenId: "u1", username: "chef_test" },
    });
    canteenApi.deleteRecipe.mockResolvedValue({});

    renderComponent();

    const optionsBtn = await screen.findByRole("button", { name: "Options" });
    await act(async () => {
      fireEvent.click(optionsBtn);
    });

    const deleteBtn = await screen.findByText("Delete");
    await act(async () => {
      fireEvent.click(deleteBtn);
    });

    const modalTitle = await screen.findByText("Delete Recipe");
    expect(modalTitle).toBeInTheDocument();
    expect(screen.getByText(/Are you sure you want to delete this recipe\?/i)).toBeInTheDocument();

    const confirmBtns = screen.getAllByText("Delete");
    await act(async () => {
      fireEvent.click(confirmBtns[confirmBtns.length - 1]);
    });

    await waitFor(() => {
      expect(canteenApi.deleteRecipe).toHaveBeenCalledWith("123");
      expect(mockNavigate).toHaveBeenCalledWith("/recipes");
    });
  });

  it("shows liked state correctly", async () => {
    const likedRecipe = {
      ...mockRecipe,
      likes: [{ user_id: "user1" }],
    };
    canteenApi.fetchRecipe.mockResolvedValue(likedRecipe);

    renderComponent();
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /♥\s*Liked/i })).toBeInTheDocument();
    });
  });

  it("renders add to list popover", async () => {
    renderComponent();
    await waitFor(() => {
      const popover = screen.getByTestId("list-add-popover");
      expect(popover).toBeInTheDocument();
      expect(popover).toHaveAttribute("data-recipe-id", "123");
      expect(popover).toHaveTextContent(/\+\s*Add to List/);
    });
  });

  it("renders share recipe popover", async () => {
    renderComponent();
    await waitFor(() => {
      const sharePopover = screen.getByTestId("share-recipe-popover");
      expect(sharePopover).toBeInTheDocument();
      expect(sharePopover).toHaveAttribute("data-recipe-id", "123");
      expect(sharePopover).toHaveTextContent("Share");
    });
  });

  it("renders back button when history is present and navigates back", async () => {
    mockLocation = { key: "not-default" };
    renderComponent();

    const backBtn = await screen.findByRole("button", { name: "Go back" });
    expect(backBtn).toBeInTheDocument();
    await act(async () => {
      fireEvent.click(backBtn);
    });
    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });

  it("does not render back button on direct load", async () => {
    mockLocation = { key: "default" };
    renderComponent();
    await waitFor(() => {
      expect(screen.queryByRole("button", { name: "Go back" })).not.toBeInTheDocument();
    });
  });
});
