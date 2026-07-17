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

// Notes self-gates (splash vs notebook), so App-level routing is auth-independent.
vi.mock("../pages/Notes", () => ({ default: () => <div>Notes Page</div> }));

describe("App Routing", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuth.mockReturnValue({ user: { username: "testuser", permissions: [] } });
  });

  it("renders Login page at /login", async () => {
    window.history.pushState({}, "Login", "/login");
    render(<App />);
    expect(await screen.findByText("Login Page")).toBeInTheDocument();
  });

  it("renders Notes at / when authenticated", async () => {
    window.history.pushState({}, "Notes", "/");
    render(<App />);
    expect(await screen.findByText("Notes Page")).toBeInTheDocument();
  });

  it("renders Notes at / for logged-out visitors (public, self-gating)", async () => {
    window.history.pushState({}, "Notes", "/");
    useAuth.mockReturnValue({ user: null });
    render(<App />);
    expect(await screen.findByText("Notes Page")).toBeInTheDocument();
  });

  it("renders the full splash (with CTA) at /splash-test even when signed in", async () => {
    window.history.pushState({}, "Splash", "/splash-test");
    render(<App />);
    expect(await screen.findByText("Your notebook, and only yours.")).toBeInTheDocument();
    // preview mode forces the call to action on despite being signed in.
    expect(screen.getByText("Login or Register")).toBeInTheDocument();
  });

  it("renders 404 for unknown routes", async () => {
    window.history.pushState({}, "404", "/random-route");
    render(<App />);
    expect(await screen.findByText("NotFound Page")).toBeInTheDocument();
  });
});
