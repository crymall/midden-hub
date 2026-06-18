import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import * as canteenApi from "@shared/core/services/canteenApi";

import RecipeForm from "../RecipeForm";

vi.mock("@shared/core/services/canteenApi");
vi.mock("../DurationInput", () => ({
  default: ({ label, onChange, value }) => (
    <div>
      <label htmlFor={label}>{label}</label>
      <input id={label} value={value || ""} onChange={(e) => onChange(e.target.value)} />
    </div>
  ),
}));

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

export let mockOnDragEnd = null;
vi.mock("@dnd-kit/core", async () => {
  const actual = await vi.importActual("@dnd-kit/core");
  return {
    ...actual,
    DndContext: ({ children, onDragEnd }) => {
      mockOnDragEnd = onDragEnd;
      return <div data-testid="dnd-context">{children}</div>;
    },
  };
});

global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

describe("RecipeForm", () => {
  const mockOnSubmit = vi.fn();

  const defaultTags = [{ id: "t1", name: "Vegan" }];
  const defaultIngredients = [{ id: "i1", name: "Salt" }];

  let queryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    canteenApi.fetchTags.mockResolvedValue(defaultTags);
    canteenApi.fetchIngredients.mockResolvedValue(defaultIngredients);
  });

  const renderComponent = (ui) =>
    render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);

  it("opens create tag modal and creates tag", async () => {
    canteenApi.createTag.mockResolvedValue({ id: "t2", name: "New Tag" });

    renderComponent(
      <MemoryRouter>
        <RecipeForm onSubmit={mockOnSubmit} />
      </MemoryRouter>,
    );

    const tagsButton = screen.getByText(/Select tags.../);
    fireEvent.click(tagsButton);

    const createBtn = screen.getByText("+ Create new tag");
    fireEvent.click(createBtn);

    expect(screen.getByText("Create New Tag")).toBeInTheDocument();

    const input = screen.getByPlaceholderText("Tag Name");
    fireEvent.change(input, { target: { value: "New Tag" } });

    const confirmBtn = screen.getByText("Create");
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(canteenApi.createTag).toHaveBeenCalledWith("New Tag");
    });
  });

  it("opens create ingredient modal and creates ingredient", async () => {
    canteenApi.fetchIngredients.mockResolvedValue([]);

    canteenApi.createIngredient.mockResolvedValue({
      id: "i2",
      name: "New Ing",
    });

    renderComponent(
      <MemoryRouter>
        <RecipeForm onSubmit={mockOnSubmit} />
      </MemoryRouter>,
    );

    const inputs = screen.getAllByPlaceholderText("Name");
    fireEvent.focus(inputs[0]);
    fireEvent.change(inputs[0], { target: { value: "New Ing" } });

    await screen.findByText('Create "New Ing"');
    fireEvent.keyDown(inputs[0], { key: "Enter", code: "Enter" });

    expect(screen.getByText("Create Ingredient")).toBeInTheDocument();
    expect(screen.getByText(/Are you sure you want to create the ingredient/)).toBeInTheDocument();
    expect(screen.getByText('"New Ing"')).toBeInTheDocument();

    const confirmBtn = screen.getByText("Create");
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(canteenApi.createIngredient).toHaveBeenCalledWith("New Ing");
    });
  });

  it("submits form with all fields including wait time", async () => {
    renderComponent(
      <MemoryRouter>
        <RecipeForm onSubmit={mockOnSubmit} submitLabel="Save Custom Recipe" />
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByLabelText(/Title/i), {
      target: { value: "My Recipe" },
    });
    fireEvent.change(screen.getByLabelText("Prep Time"), {
      target: { value: "10" },
    });
    fireEvent.change(screen.getByLabelText("Cook Time"), {
      target: { value: "20" },
    });
    fireEvent.change(screen.getByLabelText("Wait Time"), {
      target: { value: "30" },
    });
    fireEvent.change(screen.getByLabelText(/Servings/i), {
      target: { value: "4" },
    });
    fireEvent.change(screen.getByLabelText(/Instructions/i), {
      target: { value: "Mix it all together" },
    });

    const submitBtn = screen.getByText("Save Custom Recipe");
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "My Recipe",
          prep_time_minutes: 10,
          cook_time_minutes: 20,
          wait_time_minutes: 30,
          servings: 4,
          instructions: "Mix it all together",
        }),
      );
    });
  });

  it("initializes form with initialData", () => {
    const initialData = {
      formData: {
        title: "Existing Recipe",
        description: "Desc",
        prep_time_minutes: 15,
        cook_time_minutes: 30,
        wait_time_minutes: 60,
        servings: 2,
        instructions: "Do it",
      },
      ingredientGroups: [
        {
          id: "g1",
          name: "Main",
          ingredients: [
            {
              uiId: "i1",
              id: "i1",
              name: "Salt",
              quantity: "1",
              unit: "tsp",
              notes: "",
            },
          ],
        },
      ],
      selectedTags: ["t1"],
    };

    renderComponent(
      <MemoryRouter>
        <RecipeForm initialData={initialData} onSubmit={mockOnSubmit} />
      </MemoryRouter>,
    );

    expect(screen.getByLabelText(/Title/i)).toHaveValue("Existing Recipe");
    expect(screen.getByLabelText("Prep Time")).toHaveValue("15");
    expect(screen.getByLabelText("Cook Time")).toHaveValue("30");
    expect(screen.getByLabelText("Wait Time")).toHaveValue("60");
  });

  it("sanitizes empty numerical inputs to null", async () => {
    const initialData = {
      formData: {
        title: "Recipe",
        prep_time_minutes: "",
        cook_time_minutes: "",
        wait_time_minutes: "",
        servings: "4",
        description: "",
        instructions: "Bake",
      },
      ingredientGroups: [
        {
          id: "g1",
          name: "Main",
          ingredients: [
            { uiId: "i1", id: "i1", name: "Salt", quantity: "", unit: "tsp", notes: "" },
          ],
        },
      ],
      selectedTags: [],
    };

    renderComponent(
      <MemoryRouter>
        <RecipeForm
          initialData={initialData}
          onSubmit={mockOnSubmit}
          submitLabel="Save Custom Recipe 2"
        />
      </MemoryRouter>,
    );

    const submitBtn = screen.getByText("Save Custom Recipe 2");
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          prep_time_minutes: null,
          cook_time_minutes: null,
          wait_time_minutes: null,
          servings: 4,
          ingredient_groups: [
            {
              id: expect.any(String),
              name: "Main",
              ingredients: [
                expect.objectContaining({
                  id: "i1",
                  name: "Salt",
                  quantity: null,
                  unit: "tsp",
                  notes: "",
                }),
              ],
            },
          ],
        }),
      );
    });
  });

  it("prevents submission if there are unresolved ingredients", async () => {
    renderComponent(
      <MemoryRouter>
        <RecipeForm onSubmit={mockOnSubmit} submitLabel="Save Recipe with Unresolved" />
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByLabelText(/Title/i), {
      target: { value: "My Recipe" },
    });
    fireEvent.change(screen.getByLabelText(/Servings/i), {
      target: { value: "2" },
    });
    fireEvent.change(screen.getByLabelText(/Instructions/i), {
      target: { value: "Step 1" },
    });

    const nameInput = screen.getAllByPlaceholderText("Name")[0];
    fireEvent.change(nameInput, { target: { value: "New Fake Ingredient" } });

    const submitBtn = screen.getByText("Save Recipe with Unresolved");
    fireEvent.click(submitBtn);

    expect(
      await screen.findByText(/Please create or select an existing ingredient/),
    ).toBeInTheDocument();
    expect(mockOnSubmit).not.toHaveBeenCalled();
    expect(nameInput).toHaveClass("border-red-500");
  });

  it("prevents submission if required fields are missing", async () => {
    renderComponent(
      <MemoryRouter>
        <RecipeForm onSubmit={mockOnSubmit} submitLabel="Save Invalid Recipe" />
      </MemoryRouter>,
    );

    const submitBtn = screen.getByText("Save Invalid Recipe");
    fireEvent.click(submitBtn);

    expect(await screen.findByText(/Please fill out all required fields/)).toBeInTheDocument();
    expect(mockOnSubmit).not.toHaveBeenCalled();

    const titleInput = screen.getByLabelText(/Title/i);
    const servingsInput = screen.getByLabelText(/Servings/i);
    const instructionsInput = screen.getByLabelText(/Instructions/i);

    expect(titleInput).toHaveClass("border-red-500");
    expect(servingsInput).toHaveClass("border-red-500");
    expect(instructionsInput).toHaveClass("border-red-500");
  });

  it("sanitizes fraction quantities to decimals", async () => {
    const initialData = {
      formData: {
        title: "Fraction Recipe",
        prep_time_minutes: "",
        cook_time_minutes: "",
        wait_time_minutes: "",
        servings: "2",
        description: "",
        instructions: "Mix",
      },
      ingredientGroups: [
        {
          id: "g1",
          name: "Main",
          ingredients: [
            { uiId: "i1", id: "i1", name: "Flour", quantity: "1 1/2", unit: "cup", notes: "" },
            { uiId: "i2", id: "i2", name: "Sugar", quantity: "3/4", unit: "cup", notes: "" },
            { uiId: "i3", id: "i3", name: "Salt", quantity: "1-1/2", unit: "tsp", notes: "" },
            { uiId: "i4", id: "i4", name: "Water", quantity: " 1 / 3 ", unit: "cup", notes: "" },
          ],
        },
      ],
      selectedTags: [],
    };

    renderComponent(
      <MemoryRouter>
        <RecipeForm
          initialData={initialData}
          onSubmit={mockOnSubmit}
          submitLabel="Save Fractions"
        />
      </MemoryRouter>,
    );

    const submitBtn = screen.getByText("Save Fractions");
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          ingredient_groups: [
            expect.objectContaining({
              ingredients: [
                expect.objectContaining({ name: "Flour", quantity: 1.5 }),
                expect.objectContaining({ name: "Sugar", quantity: 0.75 }),
                expect.objectContaining({ name: "Salt", quantity: 1.5 }),
                expect.objectContaining({ name: "Water", quantity: 1 / 3 }),
              ],
            }),
          ],
        }),
      );
    });
  });

  it("reorders ingredients on drag end", async () => {
    const initialData = {
      formData: {
        title: "Test Recipe",
        prep_time_minutes: "",
        cook_time_minutes: "",
        wait_time_minutes: "",
        servings: "2",
        description: "",
        instructions: "Mix",
      },
      ingredientGroups: [
        {
          id: "g1",
          name: "Main",
          ingredients: [
            {
              uiId: "i1",
              id: "ing1",
              name: "Apple",
              quantity: "1",
              unit: "whole",
              notes: "",
            },
            {
              uiId: "i2",
              id: "ing2",
              name: "Banana",
              quantity: "2",
              unit: "whole",
              notes: "",
            },
          ],
        },
      ],
      selectedTags: [],
    };

    renderComponent(
      <MemoryRouter>
        <RecipeForm
          initialData={initialData}
          onSubmit={mockOnSubmit}
          submitLabel="Save Reordered"
        />
      </MemoryRouter>,
    );

    // Call the mock drag end function to simulate dragging i2 above i1
    if (mockOnDragEnd) {
      act(() => {
        mockOnDragEnd({
          active: { id: "i2", data: { current: { type: "ingredient", groupIndex: 0, index: 1 } } },
          over: { id: "i1", data: { current: { type: "ingredient", groupIndex: 0, index: 0 } } },
        });
      });
    }

    const submitBtn = screen.getByText("Save Reordered");
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          ingredient_groups: [
            expect.objectContaining({
              ingredients: [
                expect.objectContaining({ id: "ing2" }),
                expect.objectContaining({ id: "ing1" }),
              ],
            }),
          ],
        }),
      );
    });
  });
});
