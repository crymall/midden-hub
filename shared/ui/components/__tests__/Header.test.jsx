import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import Header from "../Header";

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => ({ pathname: "/current-page" }),
  };
});

vi.mock("../../../core/gateways/Can", () => ({
  default: ({ perform, children }) => {
    return perform === "allowed" ? <>{children}</> : null;
  },
}));

describe("Header Component", () => {
  const mockLogout = vi.fn();
  const user = { username: "testuser" };
  const defaultProps = {
    user,
    logout: mockLogout,
    title: "Midden",
    titleLink: "/",
    navLinks: [],
  };

  it("renders user information", () => {
    render(
      <MemoryRouter>
        <Header {...defaultProps} />
      </MemoryRouter>
    );
    expect(screen.getByText("Midden")).toBeInTheDocument();
    expect(screen.getByText("testuser")).toBeInTheDocument();
  });

  it("navigates to settings when settings button is clicked", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <Header {...defaultProps} />
      </MemoryRouter>
    );
    
    const settingsBtn = screen.getByRole("button", { name: /settings/i });
    await user.click(settingsBtn);
    expect(mockNavigate).toHaveBeenCalledWith("/settings");
  });

  it("does not render settings button when title is not Midden", () => {
    render(
      <MemoryRouter>
        <Header {...defaultProps} title="Canteen" />
      </MemoryRouter>
    );
    expect(screen.queryByRole("button", { name: /settings/i })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /logout/i })).toBeInTheDocument();
  });

  it("calls logout without navigating when logout button is clicked", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <Header {...defaultProps} />
      </MemoryRouter>
    );
    
    const logoutBtn = screen.getByRole("button", { name: /logout/i });
    await user.click(logoutBtn);
    expect(mockLogout).toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalledWith("/login");
  });

  it("renders navigation links when provided", () => {
    const navLinks = [
      { to: "/test", label: "Test Link", ariaLabel: "Test" },
    ];
    render(
      <MemoryRouter>
        <Header {...defaultProps} navLinks={navLinks} />
      </MemoryRouter>
    );
    expect(screen.getByText("Test Link")).toBeInTheDocument();
  });

  it("renders restricted link when permission is allowed", () => {
    const navLinks = [
      { to: "/restricted", label: "Restricted Link", requiredPermission: "allowed" },
    ];
    render(
      <MemoryRouter>
        <Header {...defaultProps} navLinks={navLinks} />
      </MemoryRouter>
    );
    expect(screen.getByText("Restricted Link")).toBeInTheDocument();
  });

  it("does not render restricted link when permission is denied", () => {
    const navLinks = [
      { to: "/restricted", label: "Restricted Link", requiredPermission: "denied" },
    ];
    render(
      <MemoryRouter>
        <Header {...defaultProps} navLinks={navLinks} />
      </MemoryRouter>
    );
    expect(screen.queryByText("Restricted Link")).not.toBeInTheDocument();
  });

  it("navigates to login with state when login button is clicked", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <Header {...defaultProps} user={null} />
      </MemoryRouter>
    );

    const loginBtn = screen.getByRole("button", { name: /login/i });
    await user.click(loginBtn);
    expect(mockNavigate).toHaveBeenCalledWith("/login", {
      state: { from: { pathname: "/current-page" } },
    });
  });

  it("replaces :userId in navigation links with actual user id", () => {
    const userWithId = { ...user, id: 123 };
    const navLinks = [
      { to: "/user/:userId/profile", label: "Profile" },
    ];
    render(
      <MemoryRouter>
        <Header {...defaultProps} user={userWithId} navLinks={navLinks} />
      </MemoryRouter>
    );

    const link = screen.getByText("Profile");
    expect(link).toHaveAttribute("href", "/user/123/profile");
  });

  it("does not replace :userId if user is not present", () => {
    const navLinks = [
      { to: "/user/:userId/profile", label: "Profile" },
    ];
    render(
      <MemoryRouter>
        <Header {...defaultProps} user={null} navLinks={navLinks} />
      </MemoryRouter>
    );

    const link = screen.getByText("Profile");
    expect(link).toHaveAttribute("href", "/user/:userId/profile");
  });
});