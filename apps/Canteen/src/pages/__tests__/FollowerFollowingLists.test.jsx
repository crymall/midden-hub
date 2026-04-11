import { MemoryRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useAuth } from "@shared/core/hooks/useAuth";
import * as canteenApi from "@shared/core/services/canteenApi";

import FollowerFollowingLists from "../FollowerFollowingLists";

vi.mock("@shared/core/services/canteenApi");
vi.mock("@shared/core/hooks/useAuth");

vi.mock("@shared/ui/components/MiddenCard", () => ({
  default: ({ children }) => <div data-testid="midden-card">{children}</div>,
}));

vi.mock("../../components/CanteenUserList", () => ({
  default: ({ users, onToggleFollow, onPageChange, onLimitChange }) => (
    <div data-testid="canteen-user-list">
      <div>Users Count: {users.length}</div>
      <button onClick={() => onToggleFollow("targetId", false)}>
        Mock Follow
      </button>
      <button onClick={() => onToggleFollow("targetId", true)}>
        Mock Unfollow
      </button>
      <button onClick={() => onPageChange(2)}>Next Page</button>
      <button onClick={() => onLimitChange({ target: { value: 50 } })}>
        Change Limit
      </button>
    </div>
  ),
}));

describe("FollowerFollowingLists", () => {
  const defaultUser = { id: "iam1", canteenId: "1", username: "testuser" };
  let queryClient;

  beforeEach(() => {
    vi.clearAllMocks();

    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    useAuth.mockReturnValue({ user: defaultUser });

    canteenApi.fetchFollowers.mockResolvedValue([{ id: "f1" }, { id: "f2" }]);
    canteenApi.fetchFollowing.mockResolvedValue([{ id: "f3" }]);
    canteenApi.fetchRelationshipCounts.mockResolvedValue({
      followers: 2,
      following: 1,
    });
  });

  const renderComponent = (initialRoute = "/network/1") => {
    return render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={[initialRoute]}>
          <Routes>
            <Route path="/network/:id" element={<FollowerFollowingLists />} />
            <Route
              path="/user/:id"
              element={
                <div data-testid="profile-redirect">Redirected to Profile</div>
              }
            />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );
  };

  it("returns null if no user is authenticated", async () => {
    useAuth.mockReturnValue({ user: null });
    let container;
    await act(async () => {
      const res = renderComponent();
      container = res.container;
    });
    expect(container).toBeEmptyDOMElement();
  });

  it("redirects to profile if url ID does not match the authenticated user", async () => {
    await act(async () => {
      renderComponent("/network/2");
    });
    expect(screen.getByTestId("profile-redirect")).toBeInTheDocument();
  });

  it("fetches followers and following lists on mount", async () => {
    await act(async () => {
      renderComponent();
    });
    await waitFor(() => {
      expect(canteenApi.fetchFollowers).toHaveBeenCalledWith("1", 20, 0);
      expect(canteenApi.fetchFollowing).toHaveBeenCalledWith("1", 50, 0);
      expect(canteenApi.fetchRelationshipCounts).toHaveBeenCalledWith("1");
    });
  });

  it("renders a back link to the user's profile", async () => {
    await act(async () => {
      renderComponent();
    });
    const backLink = screen.getByLabelText("Go back to profile");
    expect(backLink).toHaveAttribute("href", "/user/1");
  });

  it("renders tabs with correct counts and defaults to the followers tab", async () => {
    await act(async () => {
      renderComponent();
    });
    await waitFor(() => {
      expect(screen.getByText("Followers (2)")).toBeInTheDocument();
      expect(screen.getByText("Following (1)")).toBeInTheDocument();
      expect(screen.getByText("Users Count: 2")).toBeInTheDocument();
    });
  });

  it("switches to the following tab when clicked", async () => {
    await act(async () => {
      renderComponent();
    });
    const followingTab = await screen.findByText("Following (1)");
    await act(async () => {
      fireEvent.click(followingTab);
    });
    await waitFor(() => {
      expect(screen.getByText("Users Count: 1")).toBeInTheDocument();
    });
  });

  it("loads the following tab initially if search params specify it", async () => {
    await act(async () => {
      renderComponent("/network/1?tab=following");
    });
    await waitFor(() => {
      expect(screen.getByText("Users Count: 1")).toBeInTheDocument();
    });
  });

  it("calls followUser and refreshes both lists on follow toggle", async () => {
    canteenApi.fetchRelationshipCounts
      .mockResolvedValueOnce({ followers: 2, following: 1 })
      .mockResolvedValueOnce({ followers: 2, following: 2 });

    await act(async () => {
      renderComponent();
    });
    await act(async () => {
      fireEvent.click(screen.getByText("Mock Follow"));
    });
    await waitFor(() => {
      expect(canteenApi.followUser).toHaveBeenCalledWith("targetId");
      expect(canteenApi.fetchFollowing).toHaveBeenCalled();
      expect(canteenApi.fetchFollowers).toHaveBeenCalled();
      expect(canteenApi.fetchRelationshipCounts).toHaveBeenCalled();
      expect(screen.getByText("Following (2)")).toBeInTheDocument();
    });
  });

  it("calls unfollowUser and refreshes both lists on unfollow toggle", async () => {
    canteenApi.fetchRelationshipCounts
      .mockResolvedValueOnce({ followers: 2, following: 1 })
      .mockResolvedValueOnce({ followers: 2, following: 0 });

    await act(async () => {
      renderComponent();
    });
    await act(async () => {
      fireEvent.click(screen.getByText("Mock Unfollow"));
    });
    await waitFor(() => {
      expect(canteenApi.unfollowUser).toHaveBeenCalledWith("targetId");
      expect(canteenApi.fetchFollowing).toHaveBeenCalled();
      expect(canteenApi.fetchFollowers).toHaveBeenCalled();
      expect(canteenApi.fetchRelationshipCounts).toHaveBeenCalled();
      expect(screen.getByText("Following (0)")).toBeInTheDocument();
    });
  });

  it("handles pagination controls", async () => {
    await act(async () => {
      renderComponent();
    });

    await act(async () => {
      fireEvent.click(screen.getByText("Next Page"));
    });

    await waitFor(() => {
      expect(canteenApi.fetchFollowers).toHaveBeenCalledWith("1", 20, 20);
    });

    await act(async () => {
      fireEvent.click(screen.getByText("Change Limit"));
    });

    await waitFor(() => {
      expect(canteenApi.fetchFollowers).toHaveBeenCalledWith("1", 50, 0);
    });
  });
});
