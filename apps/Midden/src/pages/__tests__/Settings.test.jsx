import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import Settings from "../Settings";
import useAuth from "@shared/core/context/auth/useAuth";
import useData from "@shared/core/context/data/useData";
import { PERMISSIONS } from "@shared/core/utils/constants";

vi.mock("@shared/core/context/auth/useAuth");
vi.mock("@shared/core/context/data/useData");

vi.mock("../../components/UserList", () => ({
  default: () => <div data-testid="user-list">User List Component</div>,
}));

describe("Settings Component", () => {
  const mockFetchUsers = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    useData.mockReturnValue({
      fetchUsers: mockFetchUsers,
    });
  });

  it("renders profile information", () => {
    useAuth.mockReturnValue({
      user: { username: "testuser", email: "test@example.com", permissions: [] },
    });

    render(<Settings />);

    expect(screen.getByText("Settings")).toBeInTheDocument();
    expect(screen.getByText("Profile")).toBeInTheDocument();

    expect(screen.getByLabelText(/username/i)).toHaveValue("testuser");
    expect(screen.getByLabelText(/email/i)).toHaveValue("test@example.com");
  });

  it("does not show Admin Panel tab without permissions", () => {
    useAuth.mockReturnValue({
      user: { username: "user", permissions: [] },
    });

    render(<Settings />);

    expect(screen.queryByText("Admin Panel")).not.toBeInTheDocument();
    expect(mockFetchUsers).not.toHaveBeenCalled();
  });

  it("shows Admin Panel tab with permissions and fetches users", () => {
    useAuth.mockReturnValue({
      user: { username: "admin", permissions: [PERMISSIONS.writeUsers] },
    });

    render(<Settings />);

    expect(screen.getByText("Admin Panel")).toBeInTheDocument();
    expect(mockFetchUsers).toHaveBeenCalled();
  });

  it("switches to Admin Panel when tab is clicked", async () => {
    const user = userEvent.setup();
    useAuth.mockReturnValue({
      user: { username: "admin", permissions: [PERMISSIONS.writeUsers] },
    });

    render(<Settings />);

    const adminTab = screen.getByText("Admin Panel");
    await user.click(adminTab);

    expect(screen.getByText("User Admin")).toBeInTheDocument();
    expect(screen.getByTestId("user-list")).toBeInTheDocument();
  });
});