import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import RecipeFilter from "../RecipeFilter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import * as canteenApi from "@shared/core/services/canteenApi";

vi.mock("@shared/core/services/canteenApi");

describe("RecipeFilter", () => {
  const mockOnFilter = vi.fn();
  const mockTags = [
    { id: "1", name: "Vegetarian" },
    { id: "2", name: "Spicy" },
  ];

  let queryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    canteenApi.fetchTags.mockResolvedValue(mockTags);
  });

  const renderComponent = (ui) => render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
  );

  it("renders correctly and fetches tags on mount", async () => {
    renderComponent(<RecipeFilter onFilter={mockOnFilter} />);

    expect(
      screen.getByPlaceholderText("Search by title...")
    ).toBeInTheDocument();
    expect(screen.getByText("Search")).toBeInTheDocument();
    expect(screen.getByText("Clear")).toBeInTheDocument();
    await waitFor(() => {
      expect(canteenApi.fetchTags).toHaveBeenCalledTimes(1);
    });
  });

  it("updates search term and submits filter", () => {
    renderComponent(<RecipeFilter onFilter={mockOnFilter} />);

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
    renderComponent(<RecipeFilter onFilter={mockOnFilter} />);

    const trigger = await screen.findByText("Select tags...");
    fireEvent.click(trigger);

    expect(await screen.findByText("Vegetarian")).toBeInTheDocument();
    expect(await screen.findByText("Spicy")).toBeInTheDocument();

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
    renderComponent(<RecipeFilter onFilter={mockOnFilter} />);

    const input = screen.getByPlaceholderText("Search by title...");
    fireEvent.change(input, { target: { value: "Soup" } });

    const clearButton = screen.getByText("Clear");
    fireEvent.click(clearButton);

    expect(input).toHaveValue("");
    expect(mockOnFilter).toHaveBeenCalledWith({ title: "", tags: [] });
  });

  it("does not render tag filter if no tags available", () => {
    canteenApi.fetchTags.mockResolvedValue([]);

    renderComponent(<RecipeFilter onFilter={mockOnFilter} />);

    expect(screen.queryByText("Select tags...")).not.toBeInTheDocument();
    expect(screen.queryByText("Filter by Tags")).not.toBeInTheDocument();
  });
});