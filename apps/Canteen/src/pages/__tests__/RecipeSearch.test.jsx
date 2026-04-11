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

import RecipeSearch from "../RecipeSearch";

vi.mock("@shared/core/services/canteenApi");
vi.mock("@shared/core/hooks/useAuth");

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
  let queryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    canteenApi.fetchRecipes.mockResolvedValue([]);
    useAuth.mockReturnValue({ user: { permissions: [] } });
  });

  const renderComponent = () =>
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <RecipeSearch />
        </MemoryRouter>
      </QueryClientProvider>,
    );

  it("fetches recipes on mount", async () => {
    renderComponent();
    await waitFor(() => {
      expect(canteenApi.fetchRecipes).toHaveBeenCalledWith(
        20,
        0,
        undefined,
        undefined,
        undefined,
        undefined,
      );
    });
  });

  it("handles pagination interactions", async () => {
    canteenApi.fetchRecipes.mockResolvedValue(
      Array.from({ length: 20 }, (_, i) => ({ id: i + 1 })),
    );

    renderComponent();

    await waitFor(() =>
      expect(screen.getByTestId("page-val")).toHaveTextContent("1"),
    );

    await act(async () => fireEvent.click(screen.getByText("Next")));
    await waitFor(() => {
      expect(canteenApi.fetchRecipes).toHaveBeenCalledWith(
        20,
        20,
        undefined,
        undefined,
        undefined,
        undefined,
      );
      expect(screen.getByTestId("page-val")).toHaveTextContent("2");
    });

    await act(async () => fireEvent.click(screen.getByText("Prev")));
    await waitFor(() => {
      expect(canteenApi.fetchRecipes).toHaveBeenCalledWith(
        20,
        0,
        undefined,
        undefined,
        undefined,
        undefined,
      );
      expect(screen.getByTestId("page-val")).toHaveTextContent("1");
    });
  });

  it("handles limit change", async () => {
    renderComponent();

    const input = await screen.findByTestId("limit-input");
    await act(async () => fireEvent.change(input, { target: { value: "50" } }));
    await waitFor(() =>
      expect(canteenApi.fetchRecipes).toHaveBeenCalledWith(
        50,
        0,
        undefined,
        undefined,
        undefined,
        undefined,
      ),
    );
  });

  it("handles filter application", async () => {
    renderComponent();

    const filterBtn = await screen.findByTestId("filter-btn");
    await act(async () => fireEvent.click(filterBtn));

    await waitFor(() =>
      expect(canteenApi.fetchRecipes).toHaveBeenCalledWith(
        20,
        0,
        undefined,
        undefined,
        "Test Filter",
        undefined,
      ),
    );
  });

  it("passes correct disabled state to pagination controls", async () => {
    canteenApi.fetchRecipes.mockResolvedValue(
      Array.from({ length: 10 }, (_, i) => ({ id: i + 1 })),
    );

    renderComponent();
    await waitFor(() =>
      expect(screen.getByTestId("next-disabled-val")).toHaveTextContent("true"),
    );
  });

  it("passes correct loading state to pagination controls", async () => {
    canteenApi.fetchRecipes.mockImplementation(() => new Promise(() => {})); // Hang to simulate loading state

    renderComponent();
    await waitFor(() =>
      expect(screen.getByTestId("loading-val")).toHaveTextContent("true"),
    );
  });

  it("renders create button when user has permission", async () => {
    useAuth.mockReturnValue({ user: { permissions: ["write_data"] } });
    renderComponent();

    const createBtn = screen.getByText("+ Recipe");
    expect(createBtn).toBeInTheDocument();
    expect(createBtn.closest("a")).toHaveAttribute("href", "/recipes/new");
  });

  it("does not render create button when user lacks permission", async () => {
    useAuth.mockReturnValue({ user: { permissions: [] } });
    renderComponent();

    expect(screen.queryByText("+ Recipe")).not.toBeInTheDocument();
  });

  it("shows search specific empty message when filters are active", async () => {
    renderComponent();

    const filterBtn = await screen.findByTestId("filter-btn");
    await act(async () => fireEvent.click(filterBtn));

    await waitFor(() =>
      expect(
        screen.getByText("No recipes found matching your search."),
      ).toBeInTheDocument(),
    );
  });

  it("shows default empty message when no filters are active", async () => {
    renderComponent();

    await waitFor(() =>
      expect(
        screen.getByText("No recipes found in the canteen."),
      ).toBeInTheDocument(),
    );
  });
});
