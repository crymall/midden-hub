import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useAuth } from "@shared/core/hooks/useAuth";

import App from "../App";

vi.mock("@grafana/faro-react", () => {
  const { Routes } = require("react-router-dom");
  return {
    FaroRoutes: Routes,
  };
});

vi.mock("@shared/core/hooks/useAuth");

vi.mock("@shared/core/pages/Login", () => ({
  default: () => <div>Login Page</div>,
}));
vi.mock("@shared/core/pages/NotFound", () => ({
  default: () => <div>NotFound Page</div>,
}));
vi.mock("@shared/ui/components/Header", () => ({
  default: () => <div>Header Component</div>,
}));

vi.mock("../pages/Explorer", () => ({
  default: () => <div>Explorer Page</div>,
}));
vi.mock("../pages/Settings", () => ({
  default: () => <div>Settings Page</div>,
}));
vi.mock("../pages/Experiments", () => ({
  default: () => <div>Experiments Page</div>,
}));
vi.mock("../pages/About", () => ({ default: () => <div>About Page</div> }));

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

  it("renders Experiments page", async () => {
    window.history.pushState({}, "Experiments", "/experiments");
    useAuth.mockReturnValue({ user: { username: "testuser" } });
    render(<App />);
    expect(await screen.findByText("Experiments Page")).toBeInTheDocument();
  });

  it("renders About page", async () => {
    window.history.pushState({}, "About", "/about");
    useAuth.mockReturnValue({ user: { username: "testuser" } });
    render(<App />);
    expect(screen.getByText("Header Component")).toBeInTheDocument();
    expect(await screen.findByText("About Page")).toBeInTheDocument();
  });

  it("renders 404 for unknown routes when authenticated", async () => {
    window.history.pushState({}, "404", "/random-route");
    useAuth.mockReturnValue({ user: { username: "testuser" } });
    render(<App />);
    expect(await screen.findByText("NotFound Page")).toBeInTheDocument();
  });
});
