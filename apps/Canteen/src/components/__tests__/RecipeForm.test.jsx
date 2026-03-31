import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { MemoryRouter } from "react-router-dom";
import RecipeForm from "../RecipeForm";
import useData from "@shared/core/context/data/useData";

vi.mock("@shared/core/context/data/useData");
vi.mock("../DurationInput", () => ({
  default: ({ label, onChange, value }) => (
    <div>
      <label htmlFor={label}>{label}</label>
      <input
        id={label}
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
      />
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

global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

describe("RecipeForm", () => {
  const mockCreateTag = vi.fn();
  const mockCreateIngredient = vi.fn();
  const mockGetTags = vi.fn();
  const mockGetIngredients = vi.fn();
  const mockOnSubmit = vi.fn();

  const defaultTags = [{ id: "t1", name: "Vegan" }];
  const defaultIngredients = [{ id: "i1", name: "Salt" }];

  const baseData = {
    tags: defaultTags,
    getTags: mockGetTags,
    ingredients: defaultIngredients,
    getIngredients: mockGetIngredients,
    createTag: mockCreateTag,
    createIngredient: mockCreateIngredient,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    useData.mockReturnValue(baseData);
  });

  it("opens create tag modal and creates tag", async () => {
    mockCreateTag.mockResolvedValue({ id: "t2", name: "New Tag" });

    render(
      <MemoryRouter>
        <RecipeForm onSubmit={mockOnSubmit} />
      </MemoryRouter>
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
      expect(mockCreateTag).toHaveBeenCalledWith("New Tag");
    });
  });

  it("opens create ingredient modal and creates ingredient", async () => {
    useData.mockReturnValue({
      ...baseData,
      ingredients: [],
    });

    mockCreateIngredient.mockResolvedValue({ id: "i2", name: "New Ing" });

    render(
      <MemoryRouter>
        <RecipeForm onSubmit={mockOnSubmit} />
      </MemoryRouter>
    );

    const input = screen.getByPlaceholderText("Name");
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: "New Ing" } });

    await screen.findByText('Create "New Ing"');
    fireEvent.keyDown(input, { key: "Enter", code: "Enter" });

    expect(screen.getByText("Create Ingredient")).toBeInTheDocument();
    expect(screen.getByText(/Are you sure you want to create the ingredient/)).toBeInTheDocument();
    expect(screen.getByText('"New Ing"')).toBeInTheDocument();

    const confirmBtn = screen.getByText("Create");
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(mockCreateIngredient).toHaveBeenCalledWith("New Ing");
      expect(mockGetIngredients).toHaveBeenCalled();
    });
  });

  it("submits form with all fields including wait time", async () => {
    render(
      <MemoryRouter>
        <RecipeForm onSubmit={mockOnSubmit} submitLabel="Save Custom Recipe" />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText(/Title/i), { target: { value: "My Recipe" } });
    fireEvent.change(screen.getByLabelText("Prep Time"), { target: { value: "10" } });
    fireEvent.change(screen.getByLabelText("Cook Time"), { target: { value: "20" } });
    fireEvent.change(screen.getByLabelText("Wait Time"), { target: { value: "30" } });
    fireEvent.change(screen.getByLabelText(/Servings/i), { target: { value: "4" } });
    fireEvent.change(screen.getByLabelText(/Instructions/i), { target: { value: "Mix it all together" } });

    const submitBtn = screen.getByText("Save Custom Recipe");
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(expect.objectContaining({
        title: "My Recipe",
        prep_time_minutes: 10,
        cook_time_minutes: 20,
        wait_time_minutes: 30,
        servings: 4,
        instructions: "Mix it all together",
      }));
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
      ingredients: [{ id: "i1", name: "Salt", quantity: "1", unit: "tsp", notes: "" }],
      selectedTags: ["t1"],
    };

    render(
      <MemoryRouter>
        <RecipeForm initialData={initialData} onSubmit={mockOnSubmit} />
      </MemoryRouter>
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
      ingredients: [{ id: "i1", name: "Salt", quantity: "", unit: "tsp", notes: "" }],
      selectedTags: [],
    };

    render(
      <MemoryRouter>
        <RecipeForm initialData={initialData} onSubmit={mockOnSubmit} submitLabel="Save Custom Recipe 2" />
      </MemoryRouter>
    );

    const submitBtn = screen.getByText("Save Custom Recipe 2");
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(expect.objectContaining({
        prep_time_minutes: null,
        cook_time_minutes: null,
        wait_time_minutes: null,
        servings: 4,
        ingredients: [{ id: "i1", name: "Salt", quantity: null, unit: "tsp", notes: "" }]
      }));
    });
  });

  it("prevents submission if there are unresolved ingredients", async () => {
    render(
      <MemoryRouter>
        <RecipeForm onSubmit={mockOnSubmit} submitLabel="Save Recipe with Unresolved" />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText(/Title/i), { target: { value: "My Recipe" } });
    fireEvent.change(screen.getByLabelText(/Servings/i), { target: { value: "2" } });
    fireEvent.change(screen.getByLabelText(/Instructions/i), { target: { value: "Step 1" } });

    const nameInput = screen.getByPlaceholderText("Name");
    fireEvent.change(nameInput, { target: { value: "New Fake Ingredient" } });

    const submitBtn = screen.getByText("Save Recipe with Unresolved");
    fireEvent.click(submitBtn);

    expect(await screen.findByText(/Please create or select an existing ingredient/)).toBeInTheDocument();
    expect(mockOnSubmit).not.toHaveBeenCalled();
    expect(nameInput).toHaveClass("border-red-500");
  });

  it("prevents submission if required fields are missing", async () => {
    render(
      <MemoryRouter>
        <RecipeForm onSubmit={mockOnSubmit} submitLabel="Save Invalid Recipe" />
      </MemoryRouter>
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
});