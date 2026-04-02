import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import ListView from "../ListView";
import useData from "@shared/core/context/data/useData";
import useAuth from "@shared/core/context/auth/useAuth";

const mockNavigate = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock("@shared/core/context/data/useData");
vi.mock("@shared/core/context/auth/useAuth");

vi.mock("@shared/ui/components/MiddenCard", () => ({
  default: ({ children }) => (
    <div data-testid="midden-card">
      {children}
    </div>
  ),
}));

vi.mock("../../components/RecipeList", () => ({
  default: ({ recipes, loading }) => (
    <div data-testid="recipe-list">
      {loading ? "Loading Recipes..." : `Recipes: ${recipes?.length || 0}`}
    </div>
  ),
}));

describe("ListView", () => {
  const mockGetUserLists = vi.fn().mockResolvedValue([]);
  const mockGetListRecipes = vi.fn().mockResolvedValue([]);
  const mockUser = { id: "iam123", canteenId: "user123" };

  const defaultContext = {
    userLists: [],
    recipesLoading: false,
    getUserLists: mockGetUserLists,
    getListRecipes: mockGetListRecipes,
    currentListRecipes: [],
    currentListId: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockClear();
    useAuth.mockReturnValue({ user: mockUser });
    useData.mockReturnValue(defaultContext);
  });

  const renderWithRouter = (listId = "1", initialEntries = [`/lists/${listId}`], initialIndex = 0) => {
    render(
      <MemoryRouter initialEntries={initialEntries} initialIndex={initialIndex}>
        <Routes>
          <Route path="/lists/:id" element={<ListView />} />
        </Routes>
      </MemoryRouter>
    );
  };

  it("fetches list recipes on mount", async () => {
    useData.mockReturnValue({
      ...defaultContext,
      userLists: [{ id: "1", name: "My List" }],
    });

    renderWithRouter("1");

    expect(mockGetListRecipes).toHaveBeenCalledWith("1");
    expect(screen.getByText("My List")).toBeInTheDocument();
    
    await act(async () => {
      await Promise.resolve();
    });
  });

  it("does not fetch if list and recipes are cached", () => {
    useData.mockReturnValue({
      ...defaultContext,
      userLists: [{ id: "1", name: "My List" }],
      currentListRecipes: [{ id: 101, title: "Pasta" }],
      currentListId: "1",
    });

    renderWithRouter("1");

    expect(mockGetListRecipes).not.toHaveBeenCalled();
    expect(mockGetUserLists).not.toHaveBeenCalled();
    expect(screen.getByText("My List")).toBeInTheDocument();
    expect(screen.getByText("Recipes: 1")).toBeInTheDocument();
  });

  it("fetches user lists if current list is not found in context", async () => {
    renderWithRouter("1");

    expect(mockGetUserLists).toHaveBeenCalledWith("user123");
    expect(mockGetListRecipes).toHaveBeenCalledWith("1");

    await waitFor(() => {
      expect(screen.getByText("List Not Found")).toBeInTheDocument();
    });
  });

  it("shows loading state when recipes are loading", async () => {
    useData.mockReturnValue({
      ...defaultContext,
      userLists: [{ id: "1", name: "My List" }],
      recipesLoading: true,
    });

    renderWithRouter("1");

    expect(screen.getByText("Loading Recipes...")).toBeInTheDocument();

    await act(async () => {
      await Promise.resolve();
    });
  });

  it("renders list name and recipes when loaded", () => {
    const mockRecipes = [{ id: 101, title: "Pasta" }, { id: 102, title: "Soup" }];
    useData.mockReturnValue({
      ...defaultContext,
      userLists: [{ id: "1", name: "Dinner Ideas" }],
      currentListRecipes: mockRecipes,
      currentListId: "1",
    });

    renderWithRouter("1");

    expect(screen.getByText("Dinner Ideas")).toBeInTheDocument();
    expect(screen.getByText("Recipes: 2")).toBeInTheDocument();
  });

  it("handles list not found state correctly", async () => {
    useData.mockReturnValue({
      ...defaultContext,
      userLists: [{ id: "2", name: "Other List" }],
      recipesLoading: false,
    });

    renderWithRouter("1");

    await waitFor(() => {
      expect(screen.getByText("List Not Found")).toBeInTheDocument();
    });
    expect(screen.getByText("The requested list could not be found.")).toBeInTheDocument();
  });

  it("shows 'Loading List...' title if list is missing but recipes are loading", async () => {
    useData.mockReturnValue({
      ...defaultContext,
      userLists: [], 
      recipesLoading: true,
    });

    renderWithRouter("1");
    
    expect(screen.getByText("Loading List...")).toBeInTheDocument();

    await act(async () => {
      await Promise.resolve();
    });
  });

  it("renders back button if history exists and navigates back", async () => {
    useData.mockReturnValue({
      ...defaultContext,
      userLists: [{ id: "1", name: "My List" }],
      currentListId: "1",
    });
    renderWithRouter("1", ["/", "/lists/1"], 1);

    const backBtn = screen.getByRole("button", { name: "Go back" });
    expect(backBtn).toBeInTheDocument();
    fireEvent.click(backBtn);
    expect(mockNavigate).toHaveBeenCalledWith(-1);

    await act(async () => {
      await Promise.resolve();
    });
  });

  it("renders static link if no history exists", async () => {
    useData.mockReturnValue({
      ...defaultContext,
      userLists: [{ id: "1", name: "My List" }],
      currentListId: "1",
    });
    renderWithRouter("1", ["/lists/1"], 0);

    expect(screen.queryByRole("button", { name: "Go back" })).not.toBeInTheDocument();
    expect(screen.getByText("← Back to My Lists")).toBeInTheDocument();

    await act(async () => {
      await Promise.resolve();
    });
  });
});