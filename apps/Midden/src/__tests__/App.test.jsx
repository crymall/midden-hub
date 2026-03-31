import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import App from "../App";
import useAuth from "@shared/core/context/auth/useAuth";

vi.mock("@shared/core/context/auth/AuthProvider", () => ({
  default: ({ children }) => <>{children}</>,
}));
vi.mock("@shared/core/context/data/DataProvider", () => ({
  default: ({ children }) => <>{children}</>,
}));

vi.mock("@shared/core/context/auth/useAuth");

vi.mock("@shared/core/pages/Login", () => ({ default: () => <div>Login Page</div> }));
vi.mock("@shared/core/pages/NotFound", () => ({ default: () => <div>NotFound Page</div> }));
vi.mock("@shared/ui/components/Header", () => ({ default: () => <div>Header Component</div> }));

vi.mock("../pages/Explorer", () => ({ default: () => <div>Explorer Page</div> }));
vi.mock("../pages/Settings", () => ({ default: () => <div>Settings Page</div> }));
vi.mock("../pages/Experiments", () => ({ default: () => <div>Experiments Page</div> }));

describe("App Routing", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders Login page at /login", async () => {
    window.history.pushState({}, "Login", "/login");
    useAuth.mockReturnValue({ user: null });
    render(<App />);
    expect(await screen.findByText("Login Page")).toBeInTheDocument();
  });

  it("redirects to login when accessing protected route unauthenticated", async () => {
    window.history.pushState({}, "Settings", "/settings");
    useAuth.mockReturnValue({ user: null });
    render(<App />);
    expect(await screen.findByText("Login Page")).toBeInTheDocument();
  });

  it("renders Dashboard and Explorer when authenticated at /", async () => {
    window.history.pushState({}, "Home", "/");
    useAuth.mockReturnValue({ user: { username: "testuser" } });
    render(<App />);
    expect(screen.getByText("Header Component")).toBeInTheDocument();
    expect(await screen.findByText("Explorer Page")).toBeInTheDocument();
  });

  it("renders Settings page when authenticated and not guest", async () => {
    window.history.pushState({}, "Settings", "/settings");
    useAuth.mockReturnValue({ user: { username: "testuser" } });
    render(<App />);
    expect(await screen.findByText("Settings Page")).toBeInTheDocument();
  });

  it("redirects guest user from Settings to Login", async () => {
    window.history.pushState({}, "Settings", "/settings");
    useAuth.mockReturnValue({ user: { username: "guest" } });
    render(<App />);
    await waitFor(() => {
      expect(screen.queryByText("Settings Page")).not.toBeInTheDocument();
      expect(screen.getByText("Login Page")).toBeInTheDocument();
    });
  });

  it("renders Experiments page", async () => {
    window.history.pushState({}, "Experiments", "/experiments");
    useAuth.mockReturnValue({ user: { username: "testuser" } });
    render(<App />);
    expect(await screen.findByText("Experiments Page")).toBeInTheDocument();
  });

  it("renders 404 for unknown routes when authenticated", async () => {
    window.history.pushState({}, "404", "/random-route");
    useAuth.mockReturnValue({ user: { username: "testuser" } });
    render(<App />);
    expect(await screen.findByText("NotFound Page")).toBeInTheDocument();
  });
});