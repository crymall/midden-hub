import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { MemoryRouter } from "react-router-dom";
import RecipeSearch from "../RecipeSearch";
import useData from "@shared/core/context/data/useData";
import useAuth from "@shared/core/context/auth/useAuth";

vi.mock("@shared/core/context/data/useData");
vi.mock("@shared/core/context/auth/useAuth");

vi.mock("@shared/ui/components/MiddenCard", () => ({
  default: ({ children }) => <div data-testid="midden-card">{children}</div>,
}));

vi.mock("../../components/RecipeList", () => ({
  default: ({ recipes, loading, emptyMessage }) => (
    <div data-testid="recipe-list">
      {loading
        ? "Loading..."
        : recipes?.length === 0
          ? emptyMessage
          : `Recipes: ${recipes?.length}`}
    </div>
  ),
}));

vi.mock("../../components/RecipeFilter", () => ({
  default: ({ onFilter }) => (
    <button
      data-testid="filter-btn"
      onClick={() => onFilter({ title: "Test Filter" })}
    >
      Apply Filter
    </button>
  ),
}));

vi.mock("../../components/PaginationControls", () => ({
  default: ({
    page,
    limit,
    onPageChange,
    onLimitChange,
    loading,
    isNextDisabled,
  }) => (
    <div data-testid="pagination-controls">
      <span data-testid="page-val">{page}</span>
      <span data-testid="limit-val">{limit}</span>
      <span data-testid="loading-val">{String(loading)}</span>
      <span data-testid="next-disabled-val">{String(isNextDisabled)}</span>
      <button onClick={() => onPageChange(page - 1)}>Prev</button>
      <button onClick={() => onPageChange(page + 1)}>Next</button>
      <input data-testid="limit-input" value={limit} onChange={onLimitChange} />
    </div>
  ),
}));

vi.mock("@shared/core/utils/constants", () => ({
  PERMISSIONS: {
    writeData: "write_data",
  },
}));

describe("RecipeSearch", () => {
  const mockGetRecipes = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    useData.mockReturnValue({
      recipes: [],
      recipesLoading: false,
      getRecipes: mockGetRecipes,
      recipesCacheInvalid: false,
      setRecipesCacheInvalid: vi.fn(),
    });
    useAuth.mockReturnValue({ user: { permissions: [] } });
  });

  it("fetches recipes on mount if cache is empty", () => {
    render(
      <MemoryRouter>
        <RecipeSearch />
      </MemoryRouter>,
    );
    expect(mockGetRecipes).toHaveBeenCalledWith(20, 0, {});
  });

  it("does not fetch recipes on mount if cache exists", () => {
    useData.mockReturnValue({
      recipes: [{ id: 1, title: "Cached Recipe" }],
      recipesLoading: false,
      getRecipes: mockGetRecipes,
      recipesCacheInvalid: false,
    });

    render(
      <MemoryRouter>
        <RecipeSearch />
      </MemoryRouter>,
    );
    expect(mockGetRecipes).not.toHaveBeenCalled();
  });

  it("fetches recipes on mount if cache exists but recipesCacheInvalid is true", () => {
    const mockSetRecipesCacheInvalid = vi.fn();
    useData.mockReturnValue({
      recipes: [{ id: 1, title: "Cached Recipe" }],
      recipesLoading: false,
      getRecipes: mockGetRecipes,
      recipesCacheInvalid: true,
      setRecipesCacheInvalid: mockSetRecipesCacheInvalid,
    });

    render(
      <MemoryRouter>
        <RecipeSearch />
      </MemoryRouter>,
    );
    expect(mockGetRecipes).toHaveBeenCalledWith(20, 0, {});
    expect(mockSetRecipesCacheInvalid).toHaveBeenCalledWith(false);
  });

  it("handles pagination interactions", () => {
    useData.mockReturnValue({
      recipes: Array.from({ length: 20 }, (_, i) => ({ id: i + 1 })),
      recipesLoading: false,
      getRecipes: mockGetRecipes,
    });

    render(
      <MemoryRouter>
        <RecipeSearch />
      </MemoryRouter>,
    );

    expect(screen.getByTestId("page-val")).toHaveTextContent("1");

    fireEvent.click(screen.getByText("Next"));
    expect(mockGetRecipes).toHaveBeenCalledWith(20, 20, {});
    expect(screen.getByTestId("page-val")).toHaveTextContent("2");

    fireEvent.click(screen.getByText("Prev"));
    expect(mockGetRecipes).toHaveBeenCalledWith(20, 0, {});
    expect(screen.getByTestId("page-val")).toHaveTextContent("1");
  });

  it("handles limit change", () => {
    render(
      <MemoryRouter>
        <RecipeSearch />
      </MemoryRouter>,
    );

    const input = screen.getByTestId("limit-input");
    fireEvent.change(input, { target: { value: "50" } });
    expect(mockGetRecipes).toHaveBeenCalledWith(50, 0, {});
  });

  it("handles filter application", () => {
    render(
      <MemoryRouter>
        <RecipeSearch />
      </MemoryRouter>,
    );

    const filterBtn = screen.getByTestId("filter-btn");
    fireEvent.click(filterBtn);

    expect(mockGetRecipes).toHaveBeenCalledWith(20, 0, {
      title: "Test Filter",
    });
  });

  it("passes correct disabled state to pagination controls", () => {
    useData.mockReturnValue({
      recipes: Array.from({ length: 10 }, (_, i) => ({ id: i + 1 })), // 10 < 20 (default limit for pagination)
      recipesLoading: false,
      getRecipes: mockGetRecipes,
    });

    render(
      <MemoryRouter>
        <RecipeSearch />
      </MemoryRouter>,
    );
    expect(screen.getByTestId("next-disabled-val")).toHaveTextContent("true");
  });

  it("passes correct loading state to pagination controls", () => {
    useData.mockReturnValue({
      recipes: [],
      recipesLoading: true,
      getRecipes: mockGetRecipes,
    });

    render(
      <MemoryRouter>
        <RecipeSearch />
      </MemoryRouter>,
    );
    expect(screen.getByTestId("loading-val")).toHaveTextContent("true");
  });

  it("renders create button when user has permission", () => {
    useAuth.mockReturnValue({ user: { permissions: ["write_data"] } });
    render(
      <MemoryRouter>
        <RecipeSearch />
      </MemoryRouter>,
    );

    const createBtn = screen.getByText("+ Recipe");
    expect(createBtn).toBeInTheDocument();
    expect(createBtn.closest("a")).toHaveAttribute(
      "href",
      "/recipes/new",
    );
  });

  it("does not render create button when user lacks permission", () => {
    useAuth.mockReturnValue({ user: { permissions: [] } });
    render(
      <MemoryRouter>
        <RecipeSearch />
      </MemoryRouter>,
    );

    expect(screen.queryByText("+ Recipe")).not.toBeInTheDocument();
  });

  it("shows search specific empty message when filters are active", () => {
    useData.mockReturnValue({
      recipes: [],
      recipesLoading: false,
      getRecipes: mockGetRecipes,
    });

    render(
      <MemoryRouter>
        <RecipeSearch />
      </MemoryRouter>,
    );

    const filterBtn = screen.getByTestId("filter-btn");
    fireEvent.click(filterBtn);

    expect(
      screen.getByText("No recipes found matching your search."),
    ).toBeInTheDocument();
  });

  it("shows default empty message when no filters are active", () => {
    useData.mockReturnValue({
      recipes: [],
      recipesLoading: false,
      getRecipes: mockGetRecipes,
    });

    render(
      <MemoryRouter>
        <RecipeSearch />
      </MemoryRouter>,
    );
    expect(
      screen.getByText("No recipes found in the canteen."),
    ).toBeInTheDocument();
  });
});
