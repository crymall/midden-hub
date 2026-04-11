import { PERMISSIONS } from "@shared/core/utils/constants";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useAuth } from "@shared/core/hooks/useAuth";
import * as iamApi from "@shared/core/services/iamApi";

import UserList from "../UserList";

vi.mock("@shared/core/hooks/useAuth");
vi.mock("@shared/core/services/iamApi");

vi.mock("@shared/core/utils/constants", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    ROLES: { Admin: 1, Editor: 2 },
  };
});

describe("UserList Component", () => {
  let queryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    useAuth.mockReturnValue({
      user: {
        id: 99,
        username: "admin",
        permissions: [PERMISSIONS.writeUsers],
      },
    });
  });

  const renderWithClient = (ui) => render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);

  it("renders loading state", () => {
    iamApi.fetchUsers.mockImplementation(() => new Promise(() => {}));
    renderWithClient(<UserList />);
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it("renders empty state", async () => {
    iamApi.fetchUsers.mockResolvedValue({ users: [] });
    renderWithClient(<UserList />);
    expect(await screen.findByText(/no users found/i)).toBeInTheDocument();
  });

  it("renders user table", async () => {
    iamApi.fetchUsers.mockResolvedValue({
      users: [
        { id: 1, username: "user1", role: "Editor" },
        { id: 2, username: "user2", role: "Admin" },
      ],
    });

    renderWithClient(<UserList />);
    expect(await screen.findByText("user1")).toBeInTheDocument();
    expect(screen.getByText("user2")).toBeInTheDocument();
  });

  it("calls deleteUser when delete button is clicked and confirmed", async () => {
    iamApi.fetchUsers.mockResolvedValue({
      users: [{ id: 1, username: "user1", role: "Editor" }],
    });
    iamApi.deleteUser.mockResolvedValue({});

    const confirmSpy = vi.spyOn(window, "confirm").mockImplementation(() => true);
    const user = userEvent.setup();

    renderWithClient(<UserList />);
    const deleteBtn = await screen.findByRole("button", {
      name: /delete user/i,
    });
    await user.click(deleteBtn);

    expect(confirmSpy).toHaveBeenCalled();
    expect(iamApi.deleteUser).toHaveBeenCalledWith(1);
    confirmSpy.mockRestore();
  });

  it("disables admin actions for current user or other admin users", async () => {
    iamApi.fetchUsers.mockResolvedValue({
      users: [
        { id: 99, username: "admin", role: "Admin" },
        { id: 2, username: "otherAdmin", role: "Admin" },
      ],
    });

    renderWithClient(<UserList />);
    await screen.findByText("admin");

    const deleteBtns = screen.getAllByRole("button", { name: /delete user/i });
    const roleSelects = screen.getAllByRole("combobox");

    expect(deleteBtns[0]).toBeDisabled(); // Current user
    expect(roleSelects[0]).toBeDisabled();

    expect(deleteBtns[1]).toBeDisabled(); // Other admin
    expect(roleSelects[1]).toBeDisabled();
  });
});
