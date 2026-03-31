import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { MemoryRouter } from "react-router-dom";
import CanteenUserList from "../CanteenUserList";

vi.mock("@shared/ui/components/MiddenModal", () => ({
  default: ({ isOpen, children, title }) => (
    isOpen ? (
      <div data-testid="midden-modal">
        <h2>{title}</h2>
        {children}
      </div>
    ) : null
  ),
}));

vi.mock("../PaginationControls", () => ({
  default: ({ page, isNextDisabled }) => (
    <div data-testid="pagination-controls">
      Page {page} {isNextDisabled ? "Disabled" : "Active"}
    </div>
  ),
}));

describe("CanteenUserList", () => {
  const mockOnToggleFollow = vi.fn();

  const mockUsers = [
    { id: "1", username: "NotFollowedUser" },
    { id: "2", username: "JustFollowingUser" },
    { id: "3", username: "MutualFriendUser" },
  ];

  const mockFollowingList = [{ id: "2" }, { id: "3" }];
  const mockFollowersList = [{ id: "3" }];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderComponent = (props = {}) => {
    return render(
      <MemoryRouter>
        <CanteenUserList
          users={mockUsers}
          followingList={mockFollowingList}
          followersList={mockFollowersList}
          onToggleFollow={mockOnToggleFollow}
          emptyMessage="No users found."
          {...props}
        />
      </MemoryRouter>
    );
  };

  it("renders loading state", () => {
    renderComponent({ loading: true, users: [] });
    expect(screen.getByText("Loading users...")).toBeInTheDocument();
  });

  it("renders empty message when users list is empty", () => {
    renderComponent({ users: [] });
    expect(screen.getByText("No users found.")).toBeInTheDocument();
  });

  it("renders list of users with correct links", () => {
    renderComponent();
    
    expect(screen.getByText("NotFollowedUser")).toBeInTheDocument();
    expect(screen.getByText("JustFollowingUser")).toBeInTheDocument();
    expect(screen.getByText("MutualFriendUser")).toBeInTheDocument();

    const links = screen.getAllByRole("link");
    expect(links[0]).toHaveAttribute("href", "/user/1");
    expect(links[1]).toHaveAttribute("href", "/user/2");
    expect(links[2]).toHaveAttribute("href", "/user/3");
  });

  it("shows Follow button and calls onToggleFollow with false when not following", () => {
    renderComponent();
    const followButtons = screen.getAllByText("Follow");
    expect(followButtons).toHaveLength(1);
    
    fireEvent.click(followButtons[0]);
    expect(mockOnToggleFollow).toHaveBeenCalledWith("1", false);
  });

  it("shows Unfollow button and calls onToggleFollow with true when following but not mutual", () => {
    renderComponent();
    const unfollowButton = screen.getByText("Unfollow");
    expect(unfollowButton).toBeInTheDocument();
    
    fireEvent.click(unfollowButton);
    expect(mockOnToggleFollow).toHaveBeenCalledWith("2", true);
  });

  it("shows Friends button for mutual follows and opens Unfriend modal when clicked", () => {
    renderComponent();
    const friendsButtonText = screen.getByText("Friends");
    expect(friendsButtonText).toBeInTheDocument();

    fireEvent.click(friendsButtonText);

    expect(screen.getByTestId("midden-modal")).toBeInTheDocument();
    expect(screen.getByText("Unfriend User")).toBeInTheDocument();
    expect(screen.getByText(/Are you sure you want to unfollow/)).toBeInTheDocument();
    expect(screen.getAllByText("MutualFriendUser")).toHaveLength(2);
  });

  it("calls onToggleFollow with true when Unfriend is confirmed in the modal", () => {
    renderComponent();
    
    fireEvent.click(screen.getByText("Friends"));
    expect(screen.getByTestId("midden-modal")).toBeInTheDocument();

    const unfriendConfirmBtn = screen.getAllByText("Unfriend").find(btn => btn.tagName === "BUTTON");
    fireEvent.click(unfriendConfirmBtn);

    expect(mockOnToggleFollow).toHaveBeenCalledWith("3", true);
  });

  it("renders PaginationControls when pagination props are provided", () => {
    renderComponent({
      page: 2,
      limit: 20,
      onPageChange: vi.fn(),
      onLimitChange: vi.fn(),
      isNextDisabled: true,
    });

    expect(screen.getByTestId("pagination-controls")).toBeInTheDocument();
    expect(screen.getByText("Page 2 Disabled")).toBeInTheDocument();
  });
});