import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import RecipeList from "../RecipeList";

vi.mock("../RecipeCard", () => ({
  default: ({ recipe }) => <div data-testid="recipe-card">{recipe.title}</div>,
}));

describe("RecipeList", () => {
  it("renders loading state", () => {
    render(<RecipeList loading={true} />);
    expect(screen.getByText(/Loading recipes.../i)).toBeInTheDocument();
  });

  it("renders empty state when recipes is null", () => {
    render(<RecipeList recipes={null} loading={false} />);
    expect(screen.getByText(/No recipes found in the canteen/i)).toBeInTheDocument();
  });

  it("renders empty state when recipes is empty array", () => {
    render(<RecipeList recipes={[]} loading={false} />);
    expect(screen.getByText(/No recipes found in the canteen/i)).toBeInTheDocument();
  });

  it("renders custom empty message", () => {
    render(<RecipeList recipes={[]} loading={false} emptyMessage="Custom Message" />);
    expect(screen.getByText("Custom Message")).toBeInTheDocument();
  });

  it("renders a list of recipes", () => {
    const mockRecipes = [
      { id: "1", title: "Tacos" },
      { id: "2", title: "Pizza" },
    ];

    render(<RecipeList recipes={mockRecipes} loading={false} />);

    const items = screen.getAllByTestId("recipe-card");
    expect(items).toHaveLength(2);
    expect(screen.getByText("Tacos")).toBeInTheDocument();
    expect(screen.getByText("Pizza")).toBeInTheDocument();
  });
});