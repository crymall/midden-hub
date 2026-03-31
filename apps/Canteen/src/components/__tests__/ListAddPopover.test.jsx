import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import ListAddPopover from "../ListAddPopover";
import useData from "@shared/core/context/data/useData";
import useAuth from "@shared/core/context/auth/useAuth";

global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

vi.mock("@shared/core/context/data/useData");
vi.mock("@shared/core/context/auth/useAuth");

describe("ListAddPopover", () => {
  const mockGetComboboxLists = vi.fn();
  const mockHoistComboboxList = vi.fn();
  const mockAddRecipeToList = vi.fn();
  const mockCreateList = vi.fn();

  const mockCanteenApi = {
    addRecipeToList: mockAddRecipeToList,
    createList: mockCreateList,
  };

  const defaultUser = { id: "user123" };
  const defaultLists = [
    { id: "list1", name: "Favorites", updated_at: "2023-01-01" },
    { id: "list2", name: "To Cook", updated_at: "2023-01-02" },
  ];

  const baseData = {
    canteenApi: mockCanteenApi,
    comboboxLists: defaultLists,
    getComboboxLists: mockGetComboboxLists,
    hoistComboboxList: mockHoistComboboxList,
    comboboxListsLastFetched: Date.now(),
    currentComboboxQuery: "",
    comboboxListsUserId: defaultUser.id,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    useAuth.mockReturnValue({ user: defaultUser });
    useData.mockReturnValue(baseData);
  });

  it("renders the button correctly", () => {
    render(<ListAddPopover recipeId="recipe1" />);
    expect(screen.getByText("+ Add")).toBeInTheDocument();
  });

  describe("Caching Logic (ensureListsLoaded)", () => {
    it("does not fetch lists on hover if data is fresh and belongs to user", () => {
      render(<ListAddPopover recipeId="recipe1" />);
      const button = screen.getByText("+ Add");
      fireEvent.mouseEnter(button);
      expect(mockGetComboboxLists).not.toHaveBeenCalled();
    });

    it("fetches lists on hover if data is stale (> 1 min)", () => {
      useData.mockReturnValue({
        ...baseData,
        comboboxListsLastFetched: Date.now() - 61000, // 61 seconds ago
      });

      render(<ListAddPopover recipeId="recipe1" />);
      const button = screen.getByText("+ Add");
      fireEvent.mouseEnter(button);
      expect(mockGetComboboxLists).toHaveBeenCalledWith(defaultUser.id);
    });

    it("fetches lists on hover if current query is not empty (search results)", () => {
      useData.mockReturnValue({
        ...baseData,
        currentComboboxQuery: "something",
      });

      render(<ListAddPopover recipeId="recipe1" />);
      const button = screen.getByText("+ Add");
      fireEvent.mouseEnter(button);
      expect(mockGetComboboxLists).toHaveBeenCalledWith(defaultUser.id);
    });

    it("fetches lists on hover if data belongs to a different user", () => {
      useData.mockReturnValue({
        ...baseData,
        comboboxListsUserId: "otherUser",
      });

      render(<ListAddPopover recipeId="recipe1" />);
      const button = screen.getByText("+ Add");
      fireEvent.mouseEnter(button);
      expect(mockGetComboboxLists).toHaveBeenCalledWith(defaultUser.id);
    });
  });

  describe("Interaction", () => {
    it("hoists list and adds recipe when a list is selected", async () => {
      render(<ListAddPopover recipeId="recipe1" />);
      const button = screen.getByText("+ Add");
      fireEvent.click(button);

      const input = screen.getByPlaceholderText("Search or create list...");
      fireEvent.change(input, { target: { value: "Favorites" } });
      await screen.findByText("Favorites");
      fireEvent.keyDown(input, { key: "Enter", code: "Enter" });

      expect(mockAddRecipeToList).toHaveBeenCalledWith("list1", "recipe1");
      await waitFor(() => expect(mockHoistComboboxList).toHaveBeenCalledWith("list1"));
    });

    it("opens create modal and creates list", async () => {
      useData.mockReturnValue({
        ...baseData,
        comboboxLists: [],
      });

      mockCreateList.mockResolvedValue({ id: "list3", name: "New List" });

      render(<ListAddPopover recipeId="recipe1" />);
      const button = screen.getByText("+ Add");
      fireEvent.click(button);

      const input = screen.getByPlaceholderText("Search or create list...");
      fireEvent.change(input, { target: { value: "New List" } });

      await screen.findByText('Create "New List"');
      fireEvent.keyDown(input, { key: "Enter", code: "Enter" });

      expect(screen.getByText("Create New List")).toBeInTheDocument();

      const submitButton = screen.getByText("Create & Add");
      fireEvent.click(submitButton);

      await waitFor(() => expect(mockCreateList).toHaveBeenCalledWith("New List"));
      expect(mockAddRecipeToList).toHaveBeenCalledWith("list3", "recipe1");
    });
  });
});