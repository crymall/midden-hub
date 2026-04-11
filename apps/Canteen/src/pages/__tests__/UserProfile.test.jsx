import { Link, MemoryRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useAuth } from "@shared/core/hooks/useAuth";
import * as canteenApi from "@shared/core/services/canteenApi";

import UserProfile from "../UserProfile";

vi.mock("@shared/core/services/canteenApi");
vi.mock("@shared/core/hooks/useAuth");

vi.mock("../../components/RecipeList", () => ({
  default: ({ recipes }) => <div data-testid="recipe-list">{recipes.length} Recipes</div>,
}));
vi.mock("../../components/ListList", () => ({
  default: ({ userLists }) => <div data-testid="list-list">{userLists.length} Lists</div>,
}));
vi.mock("../../components/PaginationControls", () => ({
  default: ({ onPageChange, page }) => <button onClick={() => onPageChange(page + 1)}>Next Page</button>,
}));

vi.mock("@shared/ui/components/MiddenModal", () => ({
  default: ({ isOpen, children, title }) =>
    isOpen ? (
      <div data-testid="midden-modal">
        <h2>{title}</h2>
        {children}
      </div>
    ) : null,
}));

describe("UserProfile", () => {
  const defaultUser = { id: "iam1", canteenId: "1", username: "TestUser" };
  const viewedUser = { id: "2", username: "ViewedUser" };
  let queryClient;

  beforeEach(() => {
    vi.clearAllMocks();

    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false, staleTime: Infinity },
        mutations: { retry: false },
      },
    });
    useAuth.mockReturnValue({
      user: defaultUser,
    });

    canteenApi.fetchUser.mockResolvedValue(viewedUser);
    canteenApi.fetchUserRecipes.mockResolvedValue([]);
    canteenApi.fetchUserLists.mockResolvedValue([]);
    canteenApi.fetchRelationshipCounts.mockResolvedValue({
      followers: 0,
      following: 0,
    });
    canteenApi.fetchFollowers.mockResolvedValue([]);
    canteenApi.followUser.mockResolvedValue({});
    canteenApi.unfollowUser.mockResolvedValue({});
  });

  const renderComponent = (userId = "2", initialRoute = `/user/${userId}`) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={[initialRoute]}>
          <Routes>
            <Route path="/user/:id" element={<UserProfile />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );
  };

  it("renders loading state initially", async () => {
    canteenApi.fetchUser.mockImplementation(() => new Promise(() => {})); // hang
    renderComponent();
    expect(screen.getByText("Loading profile...")).toBeInTheDocument();
  });

  it("renders user profile data after loading", async () => {
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText("ViewedUser")).toBeInTheDocument();
      expect(canteenApi.fetchFollowers).toHaveBeenCalledWith("2", 1, 0, "1");
    });

    expect(screen.getByText("Recipes")).toBeInTheDocument();
  });

  it("handles user not found", async () => {
    canteenApi.fetchUser.mockResolvedValue(null);
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText("User not found.")).toBeInTheDocument();
    });
  });

  it("fetches viewedUser on mount", async () => {
    renderComponent("2");
    await waitFor(() => expect(canteenApi.fetchUser).toHaveBeenCalledWith("2"));
  });

  it("fetches recipes for the user on mount but not lists", async () => {
    renderComponent();
    await waitFor(() => {
      expect(canteenApi.fetchUserRecipes).toHaveBeenCalledWith("2", 20, 0);
      expect(canteenApi.fetchUserLists).not.toHaveBeenCalled();
    });
  });

  it("switches tabs, and fetches data only on first click for each tab", async () => {
    renderComponent();
    await waitFor(() => expect(screen.getByText("ViewedUser")).toBeInTheDocument());

    expect(canteenApi.fetchUserRecipes).toHaveBeenCalledTimes(1);
    expect(canteenApi.fetchUserLists).not.toHaveBeenCalled();

    const listsTab = screen.getByText("Lists");
    await act(async () => {
      fireEvent.click(listsTab);
    });

    await waitFor(() => {
      expect(canteenApi.fetchUserLists).toHaveBeenCalledWith("2", 20, 0);
      expect(canteenApi.fetchUserLists).toHaveBeenCalledTimes(1);
      expect(screen.getByTestId("list-list")).toBeInTheDocument();
    });

    const recipesTab = screen.getByText("Recipes");
    await act(async () => {
      fireEvent.click(recipesTab);
    });

    await waitFor(() => expect(canteenApi.fetchUserRecipes).toHaveBeenCalledTimes(1));

    await act(async () => {
      fireEvent.click(listsTab);
    });

    await waitFor(() => expect(canteenApi.fetchUserLists).toHaveBeenCalledTimes(1));
  });

  it("loads the correct tab and fetches data when URL has a tab parameter", async () => {
    renderComponent("2", "/user/2?tab=lists");
    await waitFor(() => expect(screen.getByText("ViewedUser")).toBeInTheDocument());
    await waitFor(() => {
      expect(canteenApi.fetchUserLists).toHaveBeenCalledWith("2", 20, 0);
      expect(canteenApi.fetchUserRecipes).not.toHaveBeenCalled();
    });
  });

  it("shows 'Manage My Lists' only for own profile", async () => {
    useAuth.mockReturnValue({
      user: { id: "iam2", canteenId: "2", username: "ViewedUser" },
    });
    renderComponent("2");

    await waitFor(() => expect(screen.getByText("ViewedUser")).toBeInTheDocument());

    await act(async () => {
      fireEvent.click(screen.getByText("Lists"));
    });

    expect(screen.getByText("Manage My Lists →")).toBeInTheDocument();
  });

  it("does not show 'Manage My Lists' for other profiles", async () => {
    useAuth.mockReturnValue({
      user: { id: "iam1", canteenId: "1", username: "OtherUser" },
    });
    renderComponent("2");

    await waitFor(() => expect(screen.getByText("ViewedUser")).toBeInTheDocument());

    await act(async () => {
      fireEvent.click(screen.getByText("Lists"));
    });

    expect(screen.queryByText("Manage My Lists →")).not.toBeInTheDocument();
  });

  it("renders create buttons for own profile", async () => {
    useAuth.mockReturnValue({
      user: { id: "iam2", canteenId: "2", username: "ViewedUser" },
    });
    renderComponent("2");
    await waitFor(() => expect(screen.getByText("ViewedUser")).toBeInTheDocument());

    expect(screen.getByText("+ List")).toBeInTheDocument();
    expect(screen.getByText("+ Recipe")).toBeInTheDocument();
  });

  it("opens create list modal", async () => {
    useAuth.mockReturnValue({
      user: { id: "iam2", canteenId: "2", username: "ViewedUser" },
    });
    renderComponent("2");
    await waitFor(() => expect(screen.getByText("ViewedUser")).toBeInTheDocument());

    await act(async () => {
      fireEvent.click(screen.getByText("+ List"));
    });
    expect(screen.getByTestId("midden-modal")).toBeInTheDocument();
  });

  it("clears cache and fetches new data when navigating to a different user profile", async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={[`/user/2`]}>
          <Link to="/user/3">Navigate</Link>
          <Routes>
            <Route path="/user/:id" element={<UserProfile />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );

    await waitFor(() => expect(canteenApi.fetchUserRecipes).toHaveBeenCalledTimes(1));

    canteenApi.fetchUser.mockResolvedValue({ id: "3", username: "NewUser" });
    await act(async () => {
      fireEvent.click(screen.getByText("Navigate"));
    });

    await waitFor(() => {
      expect(canteenApi.fetchUserRecipes).toHaveBeenCalledTimes(2);
      expect(canteenApi.fetchUserRecipes).toHaveBeenLastCalledWith("3", 20, 0);
    });
  });

  describe("Relationships", () => {
    it("displays follower and following counts as text for other profiles", async () => {
      canteenApi.fetchRelationshipCounts.mockResolvedValue({
        followers: 1,
        following: 2,
      });

      renderComponent();
      await waitFor(() => expect(screen.getByText("ViewedUser")).toBeInTheDocument());

      expect(screen.getByText("1")).toBeInTheDocument();
      const followersElement = screen.getByText(/Followers/);
      expect(followersElement).toBeInTheDocument();
      expect(followersElement.closest("a")).toBeNull();

      expect(screen.getByText("2")).toBeInTheDocument();
      const followingElement = screen.getByText(/Following/);
      expect(followingElement).toBeInTheDocument();
      expect(followingElement.closest("a")).toBeNull();
    });

    it("displays follower and following counts as links to network page for own profile", async () => {
      useAuth.mockReturnValue({
        user: { id: "iam2", canteenId: "2", username: "ViewedUser" },
      });
      canteenApi.fetchRelationshipCounts.mockResolvedValue({
        followers: 1,
        following: 2,
      });

      renderComponent("2");
      await waitFor(() => expect(screen.getByText("ViewedUser")).toBeInTheDocument());

      const followersLink = screen.getByText(/Followers/).closest("a");
      expect(followersLink).toBeInTheDocument();
      expect(followersLink).toHaveAttribute("href", "/user/2/network?tab=followers");

      const followingLink = screen.getByText(/Following/).closest("a");
      expect(followingLink).toBeInTheDocument();
      expect(followingLink).toHaveAttribute("href", "/user/2/network?tab=following");
    });

    it("shows Follow button for other users", async () => {
      renderComponent("2");
      await waitFor(() => expect(screen.getByText("ViewedUser")).toBeInTheDocument());
      expect(screen.getByRole("button", { name: "Follow" })).toBeInTheDocument();
    });

    it("shows Unfollow button if already following", async () => {
      canteenApi.fetchFollowers.mockResolvedValue([{ id: "1", username: "TestUser" }]);

      renderComponent("2");
      await waitFor(() => expect(screen.getByText("ViewedUser")).toBeInTheDocument());
      const unfollowBtn = await screen.findByRole("button", {
        name: "Unfollow",
      });
      expect(unfollowBtn).toBeInTheDocument();
    });

    it("calls followUser and refreshes followers on follow button click", async () => {
      canteenApi.fetchFollowers.mockResolvedValueOnce([]).mockResolvedValueOnce([{ id: "1", username: "TestUser" }]);
      renderComponent("2");
      await waitFor(() => expect(screen.getByText("ViewedUser")).toBeInTheDocument());

      const followButton = await screen.findByRole("button", {
        name: "Follow",
      });
      await act(async () => {
        fireEvent.click(followButton);
      });

      expect(canteenApi.followUser).toHaveBeenCalledWith("2");

      const unfollowBtn = await screen.findByRole("button", {
        name: "Unfollow",
      });
      expect(unfollowBtn).toBeInTheDocument();
      await waitFor(() => {
        expect(canteenApi.fetchRelationshipCounts).toHaveBeenCalledTimes(2);
      });
    });

    it("calls unfollowUser and refreshes followers on unfollow button click", async () => {
      canteenApi.fetchFollowers.mockResolvedValueOnce([{ id: "1", username: "TestUser" }]).mockResolvedValueOnce([]);
      renderComponent("2");
      const unfollowBtn = await screen.findByRole("button", {
        name: "Unfollow",
      });
      await act(async () => {
        fireEvent.click(unfollowBtn);
      });
      expect(canteenApi.unfollowUser).toHaveBeenCalledWith("2");
      const followBtn = await screen.findByRole("button", { name: "Follow" });
      expect(followBtn).toBeInTheDocument();
    });
  });
});
