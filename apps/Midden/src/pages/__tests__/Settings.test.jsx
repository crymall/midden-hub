import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import Settings from "../Settings";
import { useAuth } from "@shared/core/hooks/useAuth";
import { PERMISSIONS } from "@shared/core/utils/constants";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import * as iamApi from "@shared/core/services/iamApi";

vi.mock("@shared/core/hooks/useAuth");
vi.mock("@shared/core/services/iamApi");

vi.mock("../../components/UserList", () => ({
  default: () => <div data-testid="user-list">User List Component</div>,
}));

describe("Settings Component", () => {
  let queryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
    iamApi.fetchUsers.mockResolvedValue({ users: [] });
    iamApi.fetchUser.mockResolvedValue({ user: { email: "test@example.com" } });
  });

  const renderWithQueryClient = (ui) => render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
  );

  it("renders profile information from user object and fetched email", async () => {
    useAuth.mockReturnValue({
      user: { id: "1", username: "testuser", permissions: [] },
    });

    renderWithQueryClient(<Settings />);

    expect(screen.getByText("Settings")).toBeInTheDocument();
    expect(screen.getByText("Profile")).toBeInTheDocument();
    expect(screen.getByLabelText(/username/i)).toHaveValue("testuser");

    await waitFor(() => {
      expect(screen.getByLabelText(/email/i)).toHaveValue("test@example.com");
    });
  });

  it("does not show Admin Panel tab without permissions", () => {
    useAuth.mockReturnValue({
      user: { id: "1", username: "user", permissions: [] },
    });

    renderWithQueryClient(<Settings />);

    expect(screen.queryByText("Admin Panel")).not.toBeInTheDocument();
  });

  it("shows Admin Panel tab with permissions", () => {
    useAuth.mockReturnValue({
      user: { id: "1", username: "admin", permissions: [PERMISSIONS.writeUsers] },
    });

    renderWithQueryClient(<Settings />);

    expect(screen.getByText("Admin Panel")).toBeInTheDocument();
  });

  it("switches to Admin Panel when tab is clicked", async () => {
    const user = userEvent.setup();
    useAuth.mockReturnValue({
      user: { id: "1", username: "admin", permissions: [PERMISSIONS.writeUsers] },
    });

    renderWithQueryClient(<Settings />);

    const adminTab = screen.getByText("Admin Panel");
    await user.click(adminTab);

    expect(screen.getByText("User Admin")).toBeInTheDocument();
    expect(screen.getByTestId("user-list")).toBeInTheDocument();
  });
});