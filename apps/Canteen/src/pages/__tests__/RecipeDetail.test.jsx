import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import RecipeDetail from "../RecipeDetail";
import useData from "@shared/core/context/data/useData";
import useAuth from "@shared/core/context/auth/useAuth";

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

vi.mock("@shared/core/context/data/useData");
vi.mock("@shared/core/context/auth/useAuth");

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

// eslint-disable-next-line no-undef
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

describe("RecipeDetail", () => {
  const mockGetRecipe = vi.fn().mockResolvedValue({});
  const mockToggleRecipeLike = vi.fn();

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
    ingredients: [
      { quantity: "1", unit: "cup", name: "Flour", notes: "sifted" },
    ],
    instructions: "Mix and bake.",
    likes: [],
    tags: [{ id: "1", name: "TestTag" }],
  };

  const mockUser = { id: "user1", username: "testuser" };

  const defaultContext = {
    currentRecipe: mockRecipe,
    recipesLoading: false,
    getRecipe: mockGetRecipe,
    toggleRecipeLike: mockToggleRecipeLike,
    getUserLists: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockLocation = { key: "default" };
    mockNavigate.mockClear();
    useData.mockReturnValue(defaultContext);
    useAuth.mockReturnValue({ user: mockUser });
  });

  it("fetches recipe on mount", async () => {
    useData.mockReturnValue({ ...defaultContext, currentRecipe: null });
    render(<RecipeDetail />);
    expect(mockGetRecipe).toHaveBeenCalledWith("123");

    await act(async () => {
      await Promise.resolve(); // Flush the unresolved promise to prevent act() warnings
    });
  });

  it("renders loading state", () => {
    useData.mockReturnValue({ ...defaultContext, recipesLoading: true });
    render(<RecipeDetail />);
    expect(screen.getByText(/Loading recipe.../i)).toBeInTheDocument();
  });

  it("renders not found state", async () => {
    useData.mockReturnValue({ ...defaultContext, currentRecipe: null });
    mockGetRecipe.mockResolvedValue(null);
    render(<RecipeDetail />);
    await waitFor(() => {
      expect(screen.getByText(/Recipe not found/i)).toBeInTheDocument();
    });
  });

  it("renders recipe details correctly", () => {
    render(<RecipeDetail />);
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

  it("renders author link correctly", () => {
    render(<RecipeDetail />);
    const authorLink = screen.getByText("chef_test").closest("a");
    expect(authorLink).toHaveAttribute("href", "/user/u1");
  });

  it("formats time correctly for over 60 minutes", () => {
    useData.mockReturnValue({
      ...defaultContext,
      currentRecipe: {
        ...mockRecipe,
        prep_time_minutes: 125,
      },
    });
    render(<RecipeDetail />);
    expect(screen.getByText("2h05m")).toBeInTheDocument();
  });

  it("handles like toggle", async () => {
    render(<RecipeDetail />);
    const likeBtn = screen.getByRole("button", { name: /♡\s*Like/i });
    await act(async () => {
      fireEvent.click(likeBtn);
    });
    expect(mockToggleRecipeLike).toHaveBeenCalledWith("123", false);
  });

  it("renders edit and delete buttons in popover for owner", async () => {
    useAuth.mockReturnValue({ user: { id: "u1", username: "chef_test" } });
    render(<RecipeDetail />);

    const optionsBtn = screen.getByRole("button", { name: "Options" });
    await act(async () => {
      fireEvent.click(optionsBtn);
    });

    await waitFor(() => {
      expect(screen.getByText("Edit")).toBeInTheDocument();
      const editLink = screen.getByText("Edit").closest("a");
      expect(editLink).toHaveAttribute(
        "data-state",
        JSON.stringify({ fromDetail: true }),
      );
      expect(screen.getByText("Delete")).toBeInTheDocument();
    });
  });

  it("does not render options popover for non-owner", () => {
    useAuth.mockReturnValue({ user: { id: "user1", username: "testuser" } });
    render(<RecipeDetail />);
    expect(
      screen.queryByRole("button", { name: "Options" }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("Edit")).not.toBeInTheDocument();
    expect(screen.queryByText("Delete")).not.toBeInTheDocument();
  });

  it("handles recipe deletion", async () => {
    const mockDeleteRecipe = vi.fn().mockResolvedValue({});
    useData.mockReturnValue({
      ...defaultContext,
      deleteRecipe: mockDeleteRecipe,
    });
    useAuth.mockReturnValue({ user: { id: "u1", username: "chef_test" } });

    render(<RecipeDetail />);

    const optionsBtn = screen.getByRole("button", { name: "Options" });
    await act(async () => {
      fireEvent.click(optionsBtn);
    });

    const deleteBtn = await screen.findByText("Delete");
    await act(async () => {
      fireEvent.click(deleteBtn);
    });

    const modalTitle = await screen.findByText("Delete Recipe");
    expect(modalTitle).toBeInTheDocument();
    expect(
      screen.getByText(/Are you sure you want to delete this recipe\?/i),
    ).toBeInTheDocument();

    const confirmBtns = screen.getAllByText("Delete");
    await act(async () => {
      fireEvent.click(confirmBtns[confirmBtns.length - 1]);
    });

    await waitFor(() => {
      expect(mockDeleteRecipe).toHaveBeenCalledWith("123");
      expect(mockNavigate).toHaveBeenCalledWith("/recipes");
    });
  });

  it("shows liked state correctly", () => {
    const likedRecipe = {
      ...mockRecipe,
      likes: [{ user_id: "user1" }],
    };
    useData.mockReturnValue({
      ...defaultContext,
      currentRecipe: likedRecipe,
    });

    render(<RecipeDetail />);
    expect(
      screen.getByRole("button", { name: /♥\s*Liked/i }),
    ).toBeInTheDocument();
  });

  it("renders add to list popover", () => {
    render(<RecipeDetail />);
    const popover = screen.getByTestId("list-add-popover");
    expect(popover).toBeInTheDocument();
    expect(popover).toHaveAttribute("data-recipe-id", "123");
    expect(popover).toHaveTextContent(/\+\s*Add to List/);
  });

  it("renders share recipe popover", () => {
    render(<RecipeDetail />);
    const sharePopover = screen.getByTestId("share-recipe-popover");
    expect(sharePopover).toBeInTheDocument();
    expect(sharePopover).toHaveAttribute("data-recipe-id", "123");
    expect(sharePopover).toHaveTextContent("Share");
  });

  it("renders back button when history is present and navigates back", async () => {
    mockLocation = { key: "not-default" };
    render(<RecipeDetail />);
    const backBtn = screen.getByRole("button", { name: "Go back" });
    expect(backBtn).toBeInTheDocument();
    await act(async () => {
      fireEvent.click(backBtn);
    });
    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });

  it("does not render back button on direct load", () => {
    mockLocation = { key: "default" };
    render(<RecipeDetail />);
    expect(
      screen.queryByRole("button", { name: "Go back" }),
    ).not.toBeInTheDocument();
  });
});
