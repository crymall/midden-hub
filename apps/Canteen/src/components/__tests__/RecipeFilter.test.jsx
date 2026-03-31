import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import RecipeFilter from "../RecipeFilter";
import useData from "@shared/core/context/data/useData";

vi.mock("@shared/core/context/data/useData")

describe("RecipeFilter", () => {
  const mockOnFilter = vi.fn();
  const mockGetTags = vi.fn();
  const mockTags = [
    { id: "1", name: "Vegetarian" },
    { id: "2", name: "Spicy" },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    useData.mockReturnValue({
      tags: mockTags,
      getTags: mockGetTags,
    });
  });

  it("renders correctly and fetches tags on mount", () => {
    render(<RecipeFilter onFilter={mockOnFilter} />);

    expect(
      screen.getByPlaceholderText("Search by title...")
    ).toBeInTheDocument();
    expect(screen.getByText("Search")).toBeInTheDocument();
    expect(screen.getByText("Clear")).toBeInTheDocument();
    expect(mockGetTags).toHaveBeenCalledTimes(1);
  });

  it("updates search term and submits filter", () => {
    render(<RecipeFilter onFilter={mockOnFilter} />);

    const input = screen.getByPlaceholderText("Search by title...");
    fireEvent.change(input, { target: { value: "Pasta" } });

    const searchButton = screen.getByText("Search");
    fireEvent.click(searchButton);

    expect(mockOnFilter).toHaveBeenCalledWith({
      title: "Pasta",
      tags: [],
    });
  });

  it("handles tag selection", async () => {
    render(<RecipeFilter onFilter={mockOnFilter} />);

    const trigger = screen.getByText("Select tags...");
    fireEvent.click(trigger);

    expect(screen.getByText("Vegetarian")).toBeInTheDocument();
    expect(screen.getByText("Spicy")).toBeInTheDocument();

    const checkbox = screen.getByRole("checkbox", { name: "Vegetarian" });
    fireEvent.click(checkbox);

    expect(await screen.findByText("1 tag selected")).toBeInTheDocument();

    const searchButton = screen.getByText("Search");
    fireEvent.click(searchButton);

    expect(mockOnFilter).toHaveBeenCalledWith({
      title: "",
      tags: ["1"],
    });

    expect(screen.getByText("1 tag selected")).toBeInTheDocument();
  });

  it("clears filters", () => {
    render(<RecipeFilter onFilter={mockOnFilter} />);

    const input = screen.getByPlaceholderText("Search by title...");
    fireEvent.change(input, { target: { value: "Soup" } });

    const clearButton = screen.getByText("Clear");
    fireEvent.click(clearButton);

    expect(input).toHaveValue("");
    expect(mockOnFilter).toHaveBeenCalledWith({ title: "", tags: [] });
  });

  it("does not render tag filter if no tags available", () => {
    useData.mockReturnValue({
      tags: [],
      getTags: mockGetTags,
    });

    render(<RecipeFilter onFilter={mockOnFilter} />);

    expect(screen.queryByText("Select tags...")).not.toBeInTheDocument();
    expect(screen.queryByText("Filter by Tags")).not.toBeInTheDocument();
  });
});