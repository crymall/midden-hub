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

vi.mock("../pages/Notes", () => ({ default: () => <div>Notes Page</div> }));
vi.mock("../pages/NoteDetail", () => ({
  default: () => <div>NoteDetail Page</div>,
}));
vi.mock("../pages/NewNote", () => ({
  default: () => <div>NewNote Page</div>,
}));
vi.mock("../pages/EditNote", () => ({
  default: () => <div>EditNote Page</div>,
}));

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

  it("redirects to login when accessing notes unauthenticated", async () => {
    window.history.pushState({}, "Notes", "/");
    useAuth.mockReturnValue({ user: null });
    render(<App />);
    expect(await screen.findByText("Login Page")).toBeInTheDocument();
  });

  it("renders Notes when authenticated at /", async () => {
    window.history.pushState({}, "Notes", "/");
    useAuth.mockReturnValue({
      user: { username: "testuser", permissions: [] },
    });
    render(<App />);
    expect(await screen.findByText("Notes Page")).toBeInTheDocument();
  });

  it("renders NewNote page when authenticated", async () => {
    window.history.pushState({}, "New Note", "/notes/new");
    useAuth.mockReturnValue({
      user: { username: "testuser", permissions: [] },
    });
    render(<App />);
    expect(await screen.findByText("NewNote Page")).toBeInTheDocument();
  });

  it("renders NoteDetail page when authenticated", async () => {
    window.history.pushState({}, "Note", "/notes/123");
    useAuth.mockReturnValue({
      user: { username: "testuser", permissions: [] },
    });
    render(<App />);
    expect(await screen.findByText("NoteDetail Page")).toBeInTheDocument();
  });

  it("renders EditNote page when authenticated", async () => {
    window.history.pushState({}, "Edit Note", "/notes/123/edit");
    useAuth.mockReturnValue({
      user: { username: "testuser", permissions: [] },
    });
    render(<App />);
    expect(await screen.findByText("EditNote Page")).toBeInTheDocument();
  });

  it("redirects guest from Notes to Login", async () => {
    window.history.pushState({}, "Notes", "/");
    useAuth.mockReturnValue({ user: { username: "guest", permissions: [] } });
    render(<App />);
    expect(screen.queryByText("Notes Page")).not.toBeInTheDocument();
    expect(await screen.findByText("Login Page")).toBeInTheDocument();
  });

  it("renders 404 for unknown routes when authenticated", async () => {
    window.history.pushState({}, "404", "/random-route");
    useAuth.mockReturnValue({
      user: { username: "testuser", permissions: [] },
    });
    render(<App />);
    expect(await screen.findByText("NotFound Page")).toBeInTheDocument();
  });
});
