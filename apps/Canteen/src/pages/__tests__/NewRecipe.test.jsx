import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { MemoryRouter } from "react-router-dom";
import NewRecipe from "../NewRecipe";
import useData from "@shared/core/context/data/useData";

vi.mock("@shared/core/context/data/useData");

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock("../../components/RecipeForm", () => ({
  default: ({ onSubmit, isSubmitting, error, submitLabel }) => (
    <div data-testid="mock-recipe-form">
      {error && <div data-testid="form-error">{error}</div>}
      <button 
        disabled={isSubmitting} 
        onClick={() => onSubmit({ title: "Mock Recipe" })}
      >
        {submitLabel}
      </button>
    </div>
  ),
}));

describe("NewRecipe", () => {
  const mockCreateRecipe = vi.fn();

  const baseData = { createRecipe: mockCreateRecipe };

  beforeEach(() => {
    vi.clearAllMocks();
    useData.mockReturnValue(baseData);
  });

  it("renders the page and handles successful submission", async () => {
    mockCreateRecipe.mockResolvedValue({ id: "123" });

    render(
      <MemoryRouter>
        <NewRecipe />
      </MemoryRouter>
    );

    expect(screen.getByText("New Recipe")).toBeInTheDocument();
    
    const submitBtn = screen.getByText("Create Recipe");
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockCreateRecipe).toHaveBeenCalledWith({ title: "Mock Recipe" });
    });

    expect(mockNavigate).toHaveBeenCalledWith("/recipes/123", {
      replace: true,
    });
  });

  it("handles submission error", async () => {
    mockCreateRecipe.mockRejectedValue(new Error("Failed"));

    render(
      <MemoryRouter>
        <NewRecipe />
      </MemoryRouter>
    );

    const submitBtn = screen.getByText("Create Recipe");
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByTestId("form-error")).toHaveTextContent("Failed to create recipe. Please check your inputs and try again.");
    });
  });
});