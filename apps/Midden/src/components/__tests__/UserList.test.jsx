import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import UserList from "../UserList";
import useData from "@shared/core/context/data/useData";
import useAuth from "@shared/core/context/auth/useAuth";

vi.mock("@shared/core/context/data/useData");
vi.mock("@shared/core/context/auth/useAuth");

vi.mock("@shared/core/utils/constants", () => ({
  ROLES: { Admin: 1, Editor: 2 },
}));

describe("UserList Component", () => {
  const mockDeleteUser = vi.fn();
  const mockUpdateUserRole = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    useData.mockReturnValue({
      users: [],
      usersLoading: false,
      deleteUser: mockDeleteUser,
      updateUserRole: mockUpdateUserRole,
    });
    useAuth.mockReturnValue({
      user: { id: 99, username: "admin" },
    });
  });

  it("renders loading state", () => {
    useData.mockReturnValue({ usersLoading: true });
    render(<UserList />);
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it("renders empty state", () => {
    useData.mockReturnValue({ users: [], usersLoading: false });
    render(<UserList />);
    expect(screen.getByText(/no users found/i)).toBeInTheDocument();
  });

  it("renders user table", () => {
    const users = [
      { id: 1, username: "user1", role: "Editor" },
      { id: 2, username: "user2", role: "Admin" },
    ];
    useData.mockReturnValue({
      users,
      usersLoading: false,
      deleteUser: mockDeleteUser,
      updateUserRole: mockUpdateUserRole,
    });

    render(<UserList />);
    expect(screen.getByText("user1")).toBeInTheDocument();
    expect(screen.getByText("user2")).toBeInTheDocument();
  });

  it("calls deleteUser when delete button is clicked and confirmed", async () => {
    const users = [{ id: 1, username: "user1", role: "Editor" }];
    useData.mockReturnValue({
      users,
      usersLoading: false,
      deleteUser: mockDeleteUser,
      updateUserRole: mockUpdateUserRole,
    });

    const confirmSpy = vi.spyOn(window, "confirm").mockImplementation(() => true);
    const user = userEvent.setup();

    render(<UserList />);
    const deleteBtn = screen.getByRole("button", { name: /delete user/i });
    await user.click(deleteBtn);

    expect(confirmSpy).toHaveBeenCalled();
    expect(mockDeleteUser).toHaveBeenCalledWith(1);
    confirmSpy.mockRestore();
  });

  it("disables admin actions for current user or other admin users", () => {
    const users = [
      { id: 99, username: "admin", role: "Admin" }, // Current user
      { id: 2, username: "otherAdmin", role: "Admin" }, // Another admin
    ];
    useAuth.mockReturnValue({ user: { id: 99, username: "admin" } });
    useData.mockReturnValue({
      users,
      usersLoading: false,
      deleteUser: mockDeleteUser,
      updateUserRole: mockUpdateUserRole,
    });

    render(<UserList />);
    const deleteBtns = screen.getAllByRole("button", { name: /delete user/i });
    const roleSelects = screen.getAllByRole("combobox");

    expect(deleteBtns[0]).toBeDisabled(); // Current user
    expect(roleSelects[0]).toBeDisabled();

    expect(deleteBtns[1]).toBeDisabled(); // Other admin
    expect(roleSelects[1]).toBeDisabled();
  });
});