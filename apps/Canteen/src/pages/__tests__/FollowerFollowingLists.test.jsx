import { render, screen, fireEvent, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import FollowerFollowingLists from "../FollowerFollowingLists";
import useData from "@shared/core/context/data/useData";
import useAuth from "@shared/core/context/auth/useAuth";

vi.mock("@shared/core/context/data/useData");
vi.mock("@shared/core/context/auth/useAuth");

vi.mock("@shared/ui/components/MiddenCard", () => ({
  default: ({ children }) => <div data-testid="midden-card">{children}</div>,
}));

vi.mock("../../components/CanteenUserList", () => ({
  default: ({ users, onToggleFollow, onPageChange, onLimitChange }) => (
    <div data-testid="canteen-user-list">
      <div>Users Count: {users.length}</div>
      <button onClick={() => onToggleFollow("targetId", false)}>Mock Follow</button>
      <button onClick={() => onToggleFollow("targetId", true)}>Mock Unfollow</button>
      <button onClick={() => onPageChange(2)}>Next Page</button>
      <button onClick={() => onLimitChange({ target: { value: 50 } })}>Change Limit</button>
    </div>
  ),
}));

describe("FollowerFollowingLists", () => {
  const mockGetFollowers = vi.fn().mockResolvedValue([]);
  const mockGetFollowing = vi.fn().mockResolvedValue([]);
  const mockFollowUser = vi.fn().mockResolvedValue({});
  const mockUnfollowUser = vi.fn().mockResolvedValue({});
  const mockGetRelationshipCounts = vi.fn().mockResolvedValue({});

  const defaultUser = { id: "1", username: "testuser" };

  beforeEach(() => {
    vi.clearAllMocks();

    useAuth.mockReturnValue({ user: defaultUser });
    useData.mockReturnValue({
      followers: [{ id: "f1" }, { id: "f2" }],
      following: [{ id: "f3" }],
      relationshipCounts: { followers: 2, following: 1 },
      getRelationshipCounts: mockGetRelationshipCounts,
      getFollowers: mockGetFollowers,
      getFollowing: mockGetFollowing,
      followUser: mockFollowUser,
      unfollowUser: mockUnfollowUser,
    });
  });

  const renderComponent = (initialRoute = "/network/1") => {
    return render(
      <MemoryRouter initialEntries={[initialRoute]}>
        <Routes>
          <Route path="/network/:id" element={<FollowerFollowingLists />} />
          <Route
            path="/user/:id"
            element={<div data-testid="profile-redirect">Redirected to Profile</div>}
          />
        </Routes>
      </MemoryRouter>
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
    expect(mockGetFollowers).toHaveBeenCalledWith("1", 20, 0);
    expect(mockGetFollowing).toHaveBeenCalledWith("1", 50, 0);
    expect(mockGetRelationshipCounts).toHaveBeenCalledWith("1");
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
    expect(screen.getByText("Followers (2)")).toBeInTheDocument();
    expect(screen.getByText("Following (1)")).toBeInTheDocument();
    expect(screen.getByText("Users Count: 2")).toBeInTheDocument();
  });

  it("switches to the following tab when clicked", async () => {
    await act(async () => {
      renderComponent();
    });
    const followingTab = screen.getByText("Following (1)");
    await act(async () => {
      fireEvent.click(followingTab);
    });
    expect(screen.getByText("Users Count: 1")).toBeInTheDocument();
  });

  it("loads the following tab initially if search params specify it", async () => {
    await act(async () => {
      renderComponent("/network/1?tab=following");
    });
    expect(screen.getByText("Users Count: 1")).toBeInTheDocument();
  });

  it("calls followUser and refreshes both lists on follow toggle", async () => {
    await act(async () => {
      renderComponent();
    });
    await act(async () => {
      fireEvent.click(screen.getByText("Mock Follow"));
    });
    expect(mockFollowUser).toHaveBeenCalledWith("targetId");
    expect(mockGetFollowing).toHaveBeenCalledWith("1", 20, 0);
    expect(mockGetFollowers).toHaveBeenCalledWith("1", 20, 0);
    expect(mockGetRelationshipCounts).toHaveBeenCalledWith("1");
  });

  it("calls unfollowUser and refreshes both lists on unfollow toggle", async () => {
    await act(async () => {
      renderComponent();
    });
    await act(async () => {
      fireEvent.click(screen.getByText("Mock Unfollow"));
    });
    expect(mockUnfollowUser).toHaveBeenCalledWith("targetId");
    expect(mockGetFollowing).toHaveBeenCalledWith("1", 20, 0);
    expect(mockGetFollowers).toHaveBeenCalledWith("1", 20, 0);
    expect(mockGetRelationshipCounts).toHaveBeenCalledWith("1");
  });

  it("handles pagination controls", async () => {
    await act(async () => {
      renderComponent();
    });

    await act(async () => {
      fireEvent.click(screen.getByText("Next Page"));
    });

    expect(mockGetFollowers).toHaveBeenCalledWith("1", 20, 20);

    await act(async () => {
      fireEvent.click(screen.getByText("Change Limit"));
    });

    expect(mockGetFollowers).toHaveBeenCalledWith("1", 50, 0);
  });
});