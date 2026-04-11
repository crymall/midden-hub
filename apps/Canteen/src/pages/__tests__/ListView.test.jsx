import { MemoryRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useAuth } from "@shared/core/hooks/useAuth";
import * as canteenApi from "@shared/core/services/canteenApi";

import ListView from "../ListView";

const mockNavigate = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock("@shared/core/hooks/useAuth");
vi.mock("@shared/core/services/canteenApi");

vi.mock("@shared/ui/components/MiddenCard", () => ({
  default: ({ children }) => <div data-testid="midden-card">{children}</div>,
}));

vi.mock("../../components/RecipeList", () => ({
  default: ({ recipes, loading }) => (
    <div data-testid="recipe-list">
      {loading ? "Loading Recipes..." : `Recipes: ${recipes?.length || 0}`}
    </div>
  ),
}));

describe("ListView", () => {
  const mockUser = { id: "iam123", canteenId: "user123" };
  let queryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockClear();
    useAuth.mockReturnValue({ user: mockUser });
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    canteenApi.fetchUserLists.mockResolvedValue([]);
    canteenApi.fetchListRecipes.mockResolvedValue([]);
  });

  const renderWithRouter = (
    listId = "1",
    initialEntries = [`/lists/${listId}`],
    initialIndex = 0,
  ) => {
    render(
      <MemoryRouter initialEntries={initialEntries} initialIndex={initialIndex}>
        <QueryClientProvider client={queryClient}>
          <Routes>
            <Route path="/lists/:id" element={<ListView />} />
          </Routes>
        </QueryClientProvider>
      </MemoryRouter>,
    );
  };

  it("fetches user lists and list recipes on mount", async () => {
    canteenApi.fetchUserLists.mockResolvedValue([{ id: "1", name: "My List" }]);

    renderWithRouter("1");

    await waitFor(() => {
      expect(canteenApi.fetchUserLists).toHaveBeenCalledWith("user123", 50, 0);
      expect(canteenApi.fetchListRecipes).toHaveBeenCalledWith("1");
      expect(screen.getByText("My List")).toBeInTheDocument();
    });
  });

  it("shows loading state when recipes are loading", async () => {
    canteenApi.fetchListRecipes.mockImplementation(() => new Promise(() => {})); // Hangs forever

    renderWithRouter("1");

    await waitFor(() => {
      expect(screen.getByText("Loading Recipes...")).toBeInTheDocument();
    });
  });

  it("renders list name and recipes when loaded", async () => {
    const mockRecipes = [
      { id: 101, title: "Pasta" },
      { id: 102, title: "Soup" },
    ];
    canteenApi.fetchUserLists.mockResolvedValue([{ id: "1", name: "Dinner Ideas" }]);
    canteenApi.fetchListRecipes.mockResolvedValue(mockRecipes);

    renderWithRouter("1");

    await waitFor(() => {
      expect(screen.getByText("Dinner Ideas")).toBeInTheDocument();
      expect(screen.getByText("Recipes: 2")).toBeInTheDocument();
    });
  });

  it("handles list not found state correctly", async () => {
    canteenApi.fetchUserLists.mockResolvedValue([{ id: "2", name: "Other List" }]);

    renderWithRouter("1");

    await waitFor(() => {
      expect(screen.getByText("List Not Found")).toBeInTheDocument();
    });
    expect(screen.getByText("The requested list could not be found.")).toBeInTheDocument();
  });

  it("shows 'Loading List...' title if list is missing but recipes are loading", async () => {
    canteenApi.fetchUserLists.mockImplementation(() => new Promise(() => {}));

    renderWithRouter("1");

    expect(screen.getByText("Loading List...")).toBeInTheDocument();
  });

  it("renders back button if history exists and navigates back", async () => {
    canteenApi.fetchUserLists.mockResolvedValue([{ id: "1", name: "My List" }]);

    renderWithRouter("1", ["/", "/lists/1"], 1);

    await waitFor(() => {
      const backBtn = screen.getByRole("button", { name: "Go back" });
      expect(backBtn).toBeInTheDocument();
      fireEvent.click(backBtn);
      expect(mockNavigate).toHaveBeenCalledWith(-1);
    });
  });

  it("renders static link if no history exists", async () => {
    canteenApi.fetchUserLists.mockResolvedValue([{ id: "1", name: "My List" }]);

    renderWithRouter("1", ["/lists/1"], 0);

    await waitFor(() => {
      expect(screen.queryByRole("button", { name: "Go back" })).not.toBeInTheDocument();
      expect(screen.getByRole("link", { name: "Go back to My Lists" })).toBeInTheDocument();
    });
  });
});
