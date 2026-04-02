import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { MemoryRouter, Routes, Route, Link } from "react-router-dom";
import UserProfile from "../UserProfile";
import useData from "@shared/core/context/data/useData";
import useAuth from "@shared/core/context/auth/useAuth";

vi.mock("@shared/core/context/data/useData");
vi.mock("@shared/core/context/auth/useAuth");

vi.mock("../../components/RecipeList", () => ({
  default: ({ recipes }) => <div data-testid="recipe-list">{recipes.length} Recipes</div>,
}));
vi.mock("../../components/ListList", () => ({
  default: ({ userLists }) => <div data-testid="list-list">{userLists.length} Lists</div>,
}));
vi.mock("../../components/PaginationControls", () => ({
  default: ({ onPageChange, page }) => (
    <button onClick={() => onPageChange(page + 1)}>Next Page</button>
  ),
}));

vi.mock("@shared/ui/components/MiddenModal", () => ({
  default: ({ isOpen, children, title }) => (
    isOpen ? <div data-testid="midden-modal"><h2>{title}</h2>{children}</div> : null
  ),
}));

describe("UserProfile", () => {
  const mockCanteenApi = {
    createList: vi.fn(),
    fetchFollowers: vi.fn().mockResolvedValue([]),
  };
  const mockGetUserProfileRecipes = vi.fn();
  const mockGetUserLists = vi.fn().mockResolvedValue([]);
  const mockGetFollowers = vi.fn();
  const mockGetFollowing = vi.fn();
  const mockFollowUser = vi.fn();
  const mockUnfollowUser = vi.fn();
  const mockGetViewedUser = vi.fn();
  const mockGetRelationshipCounts = vi.fn();

  const defaultUser = { id: "iam1", canteenId: "1", username: "TestUser" };
  const viewedUser = { id: "2", username: "ViewedUser" };

  const defaultContext = {
    canteenApi: mockCanteenApi,
    getUserProfileRecipes: mockGetUserProfileRecipes,
    userProfileRecipes: [],
    getUserLists: mockGetUserLists,
    userLists: [],
    recipesLoading: false,
    followers: [],
    following: [],
    relationshipCounts: { followers: 0, following: 0 },
    getRelationshipCounts: mockGetRelationshipCounts,
    getFollowers: mockGetFollowers,
    getFollowing: mockGetFollowing,
    followUser: mockFollowUser,
    unfollowUser: mockUnfollowUser,
    viewedUser: viewedUser,
    viewedUserLoading: false,
    getViewedUser: mockGetViewedUser,
  };

  beforeEach(() => {
    vi.clearAllMocks();

    useAuth.mockReturnValue({
      user: defaultUser,
    });

    useData.mockReturnValue(defaultContext);

    mockGetViewedUser.mockResolvedValue(viewedUser);
  });

  const renderComponent = (userId = "2", initialRoute = `/user/${userId}`) => {
    return render(
      <MemoryRouter initialEntries={[initialRoute]}>
        <Routes>
          <Route path="/user/:id" element={<UserProfile />} />
        </Routes>
      </MemoryRouter>
    );
  };

  it("renders loading state initially", async () => {
    useData.mockReturnValue({
      ...defaultContext,
      viewedUser: null,
      viewedUserLoading: true,
    });
    renderComponent();
    expect(screen.getByText("Loading profile...")).toBeInTheDocument();
  });

  it("renders user profile data after loading", async () => {
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText("ViewedUser")).toBeInTheDocument();
    });
    expect(mockCanteenApi.fetchFollowers).toHaveBeenCalledWith("2", 1, 0, "1");

    expect(screen.getByText("Recipes")).toBeInTheDocument();
  });

  it("handles user not found", async () => {
    useData.mockReturnValue({
      ...defaultContext,
      viewedUser: null,
      viewedUserLoading: false,
    });
    mockGetViewedUser.mockResolvedValue(null);
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText("User not found.")).toBeInTheDocument();
    });
  });

  it("fetches viewedUser on mount if cache is empty or mismatched", async () => {
    useData.mockReturnValue({ ...defaultContext, viewedUser: null });
    renderComponent("2");
    expect(mockGetViewedUser).toHaveBeenCalledWith("2");
  });

  it("fetches recipes for the user on mount but not lists", async () => {
    renderComponent();
    await waitFor(() => {
      expect(mockGetUserProfileRecipes).toHaveBeenCalledWith("2", 20, 0);
    });
    expect(mockGetUserLists).not.toHaveBeenCalled();
  });

  it("switches tabs, and fetches data only on first click for each tab", async () => {
    renderComponent();
    await waitFor(() => expect(screen.getByText("ViewedUser")).toBeInTheDocument());

    expect(mockGetUserProfileRecipes).toHaveBeenCalledTimes(1);
    expect(mockGetUserLists).not.toHaveBeenCalled();

    const listsTab = screen.getByText("Lists");
    await act(async () => {
      fireEvent.click(listsTab);
    });

    expect(mockGetUserLists).toHaveBeenCalledWith("2", 20, 0);
    expect(mockGetUserLists).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId("list-list")).toBeInTheDocument();

    const recipesTab = screen.getByText("Recipes");
    await act(async () => {
      fireEvent.click(recipesTab);
    });

    expect(mockGetUserProfileRecipes).toHaveBeenCalledTimes(1);

    await act(async () => {
      fireEvent.click(listsTab);
    });

    expect(mockGetUserLists).toHaveBeenCalledTimes(1);
  });

  it("loads the correct tab and fetches data when URL has a tab parameter", async () => {
    renderComponent("2", "/user/2?tab=lists");
    await waitFor(() => expect(screen.getByText("ViewedUser")).toBeInTheDocument());
    expect(mockGetUserLists).toHaveBeenCalledWith("2", 20, 0);
    expect(mockGetUserProfileRecipes).not.toHaveBeenCalled();
  });

  it("shows 'Manage My Lists' only for own profile", async () => {
    useAuth.mockReturnValue({ user: { id: "iam2", canteenId: "2", username: "ViewedUser" } });
    renderComponent("2");

    await waitFor(() => expect(screen.getByText("ViewedUser")).toBeInTheDocument());

    await act(async () => {
      fireEvent.click(screen.getByText("Lists"));
    });

    expect(screen.getByText("Manage My Lists →")).toBeInTheDocument();
  });

  it("does not show 'Manage My Lists' for other profiles", async () => {
    useAuth.mockReturnValue({ user: { id: "iam1", canteenId: "1", username: "OtherUser" } });
    renderComponent("2");

    await waitFor(() => expect(screen.getByText("ViewedUser")).toBeInTheDocument());
    
    await act(async () => {
      fireEvent.click(screen.getByText("Lists"));
    });

    expect(screen.queryByText("Manage My Lists →")).not.toBeInTheDocument();
  });

  it("renders create buttons for own profile", async () => {
    useAuth.mockReturnValue({ user: { id: "iam2", canteenId: "2", username: "ViewedUser" } });
    renderComponent("2");
    await waitFor(() => expect(screen.getByText("ViewedUser")).toBeInTheDocument());

    expect(screen.getByText("+ List")).toBeInTheDocument();
    expect(screen.getByText("+ Recipe")).toBeInTheDocument();
  });

  it("opens create list modal", async () => {
    useAuth.mockReturnValue({ user: { id: "iam2", canteenId: "2", username: "ViewedUser" } });
    renderComponent("2");
    await waitFor(() => expect(screen.getByText("ViewedUser")).toBeInTheDocument());

    await act(async () => {
      fireEvent.click(screen.getByText("+ List"));
    });
    expect(screen.getByTestId("midden-modal")).toBeInTheDocument();
  });

  it("clears cache and fetches new data when navigating to a different user profile", async () => {
    render(
      <MemoryRouter initialEntries={[`/user/2`]}>
        <Link to="/user/3">Navigate</Link>
        <Routes>
          <Route path="/user/:id" element={<UserProfile />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => expect(mockGetUserProfileRecipes).toHaveBeenCalledTimes(1));

    mockGetViewedUser.mockResolvedValue({ id: "3", username: "NewUser" });
    await act(async () => {
      fireEvent.click(screen.getByText("Navigate"));
    });

    await waitFor(() => expect(mockGetUserProfileRecipes).toHaveBeenCalledTimes(2));
    expect(mockGetUserProfileRecipes).toHaveBeenLastCalledWith("3", 20, 0);
  });

  describe("Relationships", () => {
    it("displays follower and following counts as text for other profiles", async () => {
      useData.mockReturnValue({
        ...defaultContext,
        relationshipCounts: { followers: 1, following: 2 },
      });

      renderComponent();
      await waitFor(() =>
        expect(screen.getByText("ViewedUser")).toBeInTheDocument(),
      );

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
      useAuth.mockReturnValue({ user: { id: "iam2", canteenId: "2", username: "ViewedUser" } });
      useData.mockReturnValue({
        ...defaultContext,
        relationshipCounts: { followers: 1, following: 2 },
      });

      renderComponent("2");
      await waitFor(() =>
        expect(screen.getByText("ViewedUser")).toBeInTheDocument(),
      );

      const followersLink = screen.getByText(/Followers/).closest("a");
      expect(followersLink).toBeInTheDocument();
      expect(followersLink).toHaveAttribute("href", "/user/2/network?tab=followers");

      const followingLink = screen.getByText(/Following/).closest("a");
      expect(followingLink).toBeInTheDocument();
      expect(followingLink).toHaveAttribute("href", "/user/2/network?tab=following");
    });

    it("shows Follow button for other users", async () => {
      renderComponent("2");
      await waitFor(() =>
        expect(screen.getByText("ViewedUser")).toBeInTheDocument(),
      );
      expect(
        screen.getByRole("button", { name: "Follow" }),
      ).toBeInTheDocument();
    });

    it("shows Unfollow button if already following", async () => {
      mockCanteenApi.fetchFollowers.mockResolvedValueOnce([{ id: "1", username: "TestUser" }]);

      renderComponent("2");
      await waitFor(() =>
        expect(screen.getByText("ViewedUser")).toBeInTheDocument(),
      );
      const unfollowBtn = await screen.findByRole("button", { name: "Unfollow" });
      expect(unfollowBtn).toBeInTheDocument();
    });

    it("calls followUser and refreshes followers on follow button click", async () => {
      renderComponent("2");
      await waitFor(() =>
        expect(screen.getByText("ViewedUser")).toBeInTheDocument(),
      );

      const followButton = await screen.findByRole("button", { name: "Follow" });
      await act(async () => {
        fireEvent.click(followButton);
      });

      expect(mockFollowUser).toHaveBeenCalledWith("2");
      
      const unfollowBtn = await screen.findByRole("button", { name: "Unfollow" });
      expect(unfollowBtn).toBeInTheDocument();
      expect(mockGetRelationshipCounts).toHaveBeenCalledTimes(2);
    });

    it("calls unfollowUser and refreshes followers on unfollow button click", async () => {
      mockCanteenApi.fetchFollowers.mockResolvedValueOnce([{ id: "1", username: "TestUser" }]);
      renderComponent("2");
      const unfollowBtn = await screen.findByRole("button", { name: "Unfollow" });
      await act(async () => {
        fireEvent.click(unfollowBtn);
      });
      expect(mockUnfollowUser).toHaveBeenCalledWith("2");
      const followBtn = await screen.findByRole("button", { name: "Follow" });
      expect(followBtn).toBeInTheDocument();
    });
  });
});