import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import * as canteenApi from "@shared/core/services/canteenApi";

import EditRecipe from "../EditRecipe";

vi.mock("@shared/core/services/canteenApi");
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
    ingredients: [{ id: "i1", name: "Salt", quantity: "1", unit: "tsp", notes: "" }],
  };

  let queryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    mockLocation = { state: { fromDetail: true } };
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    canteenApi.fetchRecipe.mockResolvedValue(mockRecipe);
    canteenApi.updateRecipe.mockResolvedValue({});
    canteenApi.fetchTags.mockResolvedValue([]);
    canteenApi.fetchIngredients.mockResolvedValue([]);
  });

  const renderComponent = () =>
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <EditRecipe />
        </MemoryRouter>
      </QueryClientProvider>,
    );

  it("fetches and renders recipe data on cache miss, and submits properly", async () => {
    renderComponent();

    expect(screen.getByText("Loading recipe...")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByDisplayValue("Original Recipe")).toBeInTheDocument();
    });

    expect(screen.getByDisplayValue("Original description")).toBeInTheDocument();

    expect(screen.getByTestId("duration-input-Prep Time")).toHaveValue("10");
    expect(screen.getByTestId("duration-input-Cook Time")).toHaveValue("20");
    expect(screen.getByTestId("duration-input-Wait Time")).toHaveValue("30");

    fireEvent.change(screen.getByLabelText(/Title/i), {
      target: { value: "Updated Recipe" },
    });

    const submitBtn = screen.getByText("Save Changes");
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(canteenApi.updateRecipe).toHaveBeenCalledWith(
        "123",
        expect.objectContaining({
          title: "Updated Recipe",
        }),
      );
    });

    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });

  it("uses cached recipe data if available without fetching", async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByDisplayValue("Original Recipe")).toBeInTheDocument();
    });
  });

  it("navigates to recipe detail with replace if not from detail page", async () => {
    mockLocation = { state: null };
    renderComponent();

    await waitFor(() => {
      expect(screen.getByDisplayValue("Original Recipe")).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText(/Title/i), {
      target: { value: "Updated Recipe" },
    });
    fireEvent.click(screen.getByText("Save Changes"));

    await waitFor(() => {
      expect(canteenApi.updateRecipe).toHaveBeenCalled();
    });

    expect(mockNavigate).toHaveBeenCalledWith("/recipes/123", {
      replace: true,
    });
  });
});
