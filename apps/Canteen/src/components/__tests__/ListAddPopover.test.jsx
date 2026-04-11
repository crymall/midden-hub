import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useAuth } from "@shared/core/hooks/useAuth";
import * as canteenApi from "@shared/core/services/canteenApi";

import ListAddPopover from "../ListAddPopover";

global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

vi.mock("@shared/core/hooks/useAuth");
vi.mock("@shared/core/services/canteenApi");

describe("ListAddPopover", () => {
  const defaultUser = { id: "iam123", canteenId: "user123" };
  const defaultLists = [
    { id: "list1", name: "Favorites", updated_at: "2023-01-01" },
    { id: "list2", name: "To Cook", updated_at: "2023-01-02" },
  ];

  let queryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    useAuth.mockReturnValue({ user: defaultUser });
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    canteenApi.fetchUserLists.mockResolvedValue(defaultLists);
    canteenApi.addRecipeToList.mockResolvedValue({});
    canteenApi.createList.mockResolvedValue({ id: "list3", name: "New List" });
  });

  const renderComponent = (ui) => render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);

  it("renders the button correctly", () => {
    renderComponent(<ListAddPopover recipeId="recipe1" />);
    expect(screen.getByText("+ Add")).toBeInTheDocument();
  });

  describe("Interaction", () => {
    it("hoists list and adds recipe when a list is selected", async () => {
      renderComponent(<ListAddPopover recipeId="recipe1" />);
      const button = screen.getByText("+ Add");
      fireEvent.click(button);

      const input = screen.getByPlaceholderText("Search or create list...");
      fireEvent.change(input, { target: { value: "Favorites" } });
      await screen.findByText("Favorites");
      fireEvent.keyDown(input, { key: "Enter", code: "Enter" });

      await waitFor(() => expect(canteenApi.addRecipeToList).toHaveBeenCalledWith("list1", "recipe1"));
    });

    it("opens create modal and creates list", async () => {
      canteenApi.fetchUserLists.mockResolvedValue([]);

      renderComponent(<ListAddPopover recipeId="recipe1" />);
      const button = screen.getByText("+ Add");
      fireEvent.click(button);

      const input = screen.getByPlaceholderText("Search or create list...");
      fireEvent.change(input, { target: { value: "New List" } });

      await screen.findByText('Create "New List"');
      fireEvent.keyDown(input, { key: "Enter", code: "Enter" });

      expect(screen.getByText("Create New List")).toBeInTheDocument();

      const submitButton = screen.getByText("Create & Add");
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(canteenApi.createList).toHaveBeenCalledWith("New List");
        expect(canteenApi.addRecipeToList).toHaveBeenCalledWith("list3", "recipe1");
      });
    });
  });
});
