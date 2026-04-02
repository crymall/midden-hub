import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { MemoryRouter } from "react-router-dom";
import RecipeCard from '../RecipeCard';
import useData from "@shared/core/context/data/useData";
import useAuth from "@shared/core/context/auth/useAuth";

vi.mock("@shared/core/context/data/useData");
vi.mock("@shared/core/context/auth/useAuth");
vi.mock("@shared/core/gateways/Can", () => ({
  default: ({ children }) => <div data-testid="can-gate">{children}</div>,
}));

vi.mock("../ListAddPopover", () => ({
  default: ({ recipeId }) => (
    <button data-testid="list-add-popover" data-recipe-id={recipeId}>
      + Add
    </button>
  ),
}));

describe("RecipeCard", () => {
  const mockUser = { id: "iam123", canteenId: "user123" };

  const defaultContext = {
  };

  const mockRecipe = {
    id: "123",
    title: "Spicy Tacos",
    description: "Delicious tacos with spicy salsa.",
    likes: ["user1", "user2", "user3"],
    tags: [
      { id: "1", name: "Mexican" },
      { id: "2", name: "Spicy" },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    useAuth.mockReturnValue({ user: mockUser });
    useData.mockReturnValue(defaultContext);
  });

  it("renders the recipe title", () => {
    render(
      <MemoryRouter>
        <RecipeCard recipe={mockRecipe} />
      </MemoryRouter>
    );
    expect(screen.getByText("Spicy Tacos")).toBeInTheDocument();
  });

  it("renders the recipe description", () => {
    render(
      <MemoryRouter>
        <RecipeCard recipe={mockRecipe} />
      </MemoryRouter>
    );
    expect(screen.getByText("Delicious tacos with spicy salsa.")).toBeInTheDocument();
  });

  it("truncates the description at the last complete word within 150 characters", () => {
    const longDescription = "word ".repeat(29) + "cutoff";
    const recipeWithLongDesc = { ...mockRecipe, description: longDescription };
    render(
      <MemoryRouter>
        <RecipeCard recipe={recipeWithLongDesc} />
      </MemoryRouter>
    );
    const expected = "word ".repeat(29).trim() + "...";
    expect(screen.getByText(expected)).toBeInTheDocument();
  });

  it("renders the like count when likes exist", () => {
    render(
      <MemoryRouter>
        <RecipeCard recipe={mockRecipe} />
      </MemoryRouter>
    );
    expect(screen.getByText("♥ 3")).toBeInTheDocument();
  });

  it("formats large like counts compactly", () => {
    const recipeManyLikes = { ...mockRecipe, likes: new Array(1200).fill("user") };
    render(
      <MemoryRouter>
        <RecipeCard recipe={recipeManyLikes} />
      </MemoryRouter>
    );
    expect(screen.getByText("♥ 1.2K")).toBeInTheDocument();
  });

  it("does not render the like count when likes are empty", () => {
    const recipeNoLikes = { ...mockRecipe, likes: [] };
    render(
      <MemoryRouter>
        <RecipeCard recipe={recipeNoLikes} />
      </MemoryRouter>
    );
    expect(screen.queryByText(/♥/)).not.toBeInTheDocument();
  });

  it("renders tags correctly", () => {
    render(
      <MemoryRouter>
        <RecipeCard recipe={mockRecipe} />
      </MemoryRouter>
    );
    expect(screen.getByText("Mexican")).toBeInTheDocument();
    expect(screen.getByText("Spicy")).toBeInTheDocument();
  });

  it("links to the correct recipe detail page", () => {
    render(
      <MemoryRouter>
        <RecipeCard recipe={mockRecipe} />
      </MemoryRouter>
    );
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/recipes/123");
  });

  it("renders the add to list popover", () => {
    render(
      <MemoryRouter>
        <RecipeCard recipe={mockRecipe} />
      </MemoryRouter>
    );
    const popover = screen.getByTestId("list-add-popover");
    expect(popover).toBeInTheDocument();
    expect(popover).toHaveAttribute("data-recipe-id", "123");
  });

  it("applies inverse styles when inverse prop is true", () => {
    render(
      <MemoryRouter>
        <RecipeCard recipe={mockRecipe} inverse={true} />
      </MemoryRouter>
    );
    const card = screen.getByText("Spicy Tacos").closest("div.group");
    expect(card).toHaveClass("bg-dark/50", "border-lightestGrey");
  });

  it("applies default styles when inverse prop is false", () => {
    render(
      <MemoryRouter>
        <RecipeCard recipe={mockRecipe} />
      </MemoryRouter>
    );
    const card = screen.getByText("Spicy Tacos").closest("div.group");
    expect(card).toHaveClass("bg-primary/20", "border-accent");
  });
});