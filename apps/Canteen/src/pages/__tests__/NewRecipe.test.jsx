import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { MemoryRouter } from "react-router-dom";
import NewRecipe from "../NewRecipe";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import * as canteenApi from "@shared/core/services/canteenApi";

vi.mock("@shared/core/services/canteenApi");

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
  let queryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  });

  const renderComponent = () => render(
    <QueryClientProvider client={queryClient}><MemoryRouter><NewRecipe /></MemoryRouter></QueryClientProvider>
  );

  it("renders the page and handles successful submission", async () => {
    canteenApi.createRecipe.mockResolvedValue({ id: "123" });

    renderComponent();

    expect(screen.getByText("New Recipe")).toBeInTheDocument();
    
    const submitBtn = screen.getByText("Create Recipe");
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(canteenApi.createRecipe).toHaveBeenCalledWith({ title: "Mock Recipe" });
    });

    expect(mockNavigate).toHaveBeenCalledWith("/recipes/123", {
      replace: true,
    });
  });

  it("handles submission error", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    canteenApi.createRecipe.mockRejectedValue(new Error("Failed"));

    renderComponent();

    const submitBtn = screen.getByText("Create Recipe");
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByTestId("form-error")).toHaveTextContent("Failed to create recipe. Please check your inputs and try again.");
    });
    consoleSpy.mockRestore();
  });
});