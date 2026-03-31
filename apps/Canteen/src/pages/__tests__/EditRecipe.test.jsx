import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { MemoryRouter } from "react-router-dom";
import EditRecipe from "../EditRecipe";
import useData from "@shared/core/context/data/useData";

vi.mock("@shared/core/context/data/useData");
vi.mock("../../components/DurationInput", () => ({
  default: ({ label, onChange, value }) => (
    <div>
      <label htmlFor={label}>{label}</label>
      <input
        id={label}
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        data-testid={`duration-input-${label}`}
      />
    </div>
  ),
}));

const mockNavigate = vi.fn();
let mockLocation = { state: { fromDetail: true } };
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => ({ id: "123" }),
    useLocation: () => mockLocation,
  };
});

global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

describe("EditRecipe", () => {
  const mockGetRecipe = vi.fn();
  const mockUpdateRecipe = vi.fn();
  const mockAddRecipeTag = vi.fn();
  const mockRemoveRecipeTag = vi.fn();
  const mockAddRecipeIngredient = vi.fn();
  const mockRemoveRecipeIngredient = vi.fn();

  const mockRecipe = {
    id: "123",
    title: "Original Recipe",
    description: "Original description",
    prep_time_minutes: 10,
    cook_time_minutes: 20,
    wait_time_minutes: 30,
    servings: 4,
    instructions: "Mix and match",
    tags: [{ id: "t1", name: "Vegan" }],
    ingredients: [
      { id: "i1", name: "Salt", quantity: "1", unit: "tsp", notes: "" },
    ],
  };

  const baseData = {
    getRecipe: mockGetRecipe,
    currentRecipe: null,
    canteenApi: {
      updateRecipe: mockUpdateRecipe,
      addRecipeTag: mockAddRecipeTag,
      removeRecipeTag: mockRemoveRecipeTag,
      addRecipeIngredient: mockAddRecipeIngredient,
      removeRecipeIngredient: mockRemoveRecipeIngredient,
    },
    tags: [{ id: "t1", name: "Vegan" }, { id: "t2", name: "Keto" }],
    getTags: vi.fn(),
    ingredients: [],
    getIngredients: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockLocation = { state: { fromDetail: true } };
    useData.mockReturnValue(baseData);
    mockGetRecipe.mockResolvedValue(mockRecipe);
  });

  it("fetches and renders recipe data on cache miss, and submits properly", async () => {
    render(
      <MemoryRouter>
        <EditRecipe />
      </MemoryRouter>
    );

    expect(screen.getByText("Loading recipe...")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByDisplayValue("Original Recipe")).toBeInTheDocument();
    });
    
    expect(screen.getByDisplayValue("Original description")).toBeInTheDocument();
    
    expect(screen.getByTestId("duration-input-Prep Time")).toHaveValue("10");
    expect(screen.getByTestId("duration-input-Cook Time")).toHaveValue("20");
    expect(screen.getByTestId("duration-input-Wait Time")).toHaveValue("30");

    fireEvent.change(screen.getByLabelText(/Title/i), { target: { value: "Updated Recipe" } });

    const submitBtn = screen.getByText("Save Changes");
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockUpdateRecipe).toHaveBeenCalledWith("123", expect.objectContaining({
        title: "Updated Recipe",
      }));
    });

    expect(mockGetRecipe).toHaveBeenCalledTimes(2);
    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });

  it("uses cached recipe data if available without fetching", async () => {
    useData.mockReturnValue({
      ...baseData,
      currentRecipe: mockRecipe,
    });

    render(
      <MemoryRouter>
        <EditRecipe />
      </MemoryRouter>
    );

    expect(mockGetRecipe).not.toHaveBeenCalled();
    
    await waitFor(() => {
      expect(screen.getByDisplayValue("Original Recipe")).toBeInTheDocument();
    });
  });

  it("navigates to recipe detail with replace if not from detail page", async () => {
    mockLocation = { state: null };
    useData.mockReturnValue({
      ...baseData,
      currentRecipe: mockRecipe,
    });

    render(
      <MemoryRouter>
        <EditRecipe />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByDisplayValue("Original Recipe")).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText(/Title/i), { target: { value: "Updated Recipe" } });
    fireEvent.click(screen.getByText("Save Changes"));

    await waitFor(() => {
      expect(mockUpdateRecipe).toHaveBeenCalled();
    });

    expect(mockNavigate).toHaveBeenCalledWith("/recipes/123", { replace: true });
  });
});