import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { MemoryRouter } from "react-router-dom";
import CanteenHome from "../CanteenHome";
import useAuth from "@shared/core/context/auth/useAuth";

const mockNavigate = vi.fn();
const mockLocation = { pathname: "" };

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => mockLocation,
  };
});

vi.mock("@shared/core/context/auth/useAuth");

vi.mock("@shared/ui/components/MiddenCard", () => ({
  default: ({ children }) => <div data-testid="midden-card">{children}</div>,
}));

describe("CanteenHome", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockClear();
  });

  it("renders correctly", () => {
    useAuth.mockReturnValue({ user: { id: "1" } });
    render(
      <MemoryRouter>
        <CanteenHome />
      </MemoryRouter>
    );

    expect(screen.getByText(/Find and Share/i)).toBeInTheDocument();
    expect(screen.getByText("Recipes.")).toBeInTheDocument();
    expect(screen.getByText(/That’s it./i)).toBeInTheDocument();
    expect(screen.getByText(/Curate your own recipe book./i)).toBeInTheDocument();
  });

  it("renders the 'Login or Register' button when no user is authenticated", () => {
    useAuth.mockReturnValue({ user: null });
    render(
      <MemoryRouter>
        <CanteenHome />
      </MemoryRouter>
    );

    expect(screen.getByRole("button", { name: "Login or Register" })).toBeInTheDocument();
  });

  it("does not render the 'Login or Register' button when user is authenticated", () => {
    useAuth.mockReturnValue({ user: { id: "1" } });
    render(
      <MemoryRouter>
        <CanteenHome />
      </MemoryRouter>
    );

    expect(screen.queryByRole("button", { name: "Login or Register" })).not.toBeInTheDocument();
  });

  it("navigates to login on button click with correct state", () => {
    useAuth.mockReturnValue({ user: null });
    render(
      <MemoryRouter>
        <CanteenHome />
      </MemoryRouter>
    );

    const loginButton = screen.getByRole("button", { name: "Login or Register" });
    fireEvent.click(loginButton);

    expect(mockNavigate).toHaveBeenCalledWith("/login", {
      state: { from: mockLocation },
    });
  });
});