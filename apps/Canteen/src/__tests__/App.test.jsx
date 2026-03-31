import { render, screen } from "@testing-library/react";
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

vi.mock("../pages/CanteenHome", () => ({ default: () => <div>CanteenHome Page</div> }));
vi.mock("../pages/RecipeSearch", () => ({ default: () => <div>RecipeSearch Page</div> }));
vi.mock("../pages/RecipeDetail", () => ({ default: () => <div>RecipeDetail Page</div> }));
vi.mock("../pages/EditRecipe", () => ({ default: () => <div>EditRecipe Page</div> }));
vi.mock("../pages/NewRecipe", () => ({ default: () => <div>NewRecipe Page</div> }));
vi.mock("../pages/MyLists", () => ({ default: () => <div>MyLists Page</div> }));
vi.mock("../pages/ListView", () => ({ default: () => <div>ListView Page</div> }));
vi.mock("../pages/UserProfile", () => ({ default: () => <div>UserProfile Page</div> }));
vi.mock("../pages/Messages", () => ({ default: () => <div>Messages Page</div> }));
vi.mock("../pages/Conversation", () => ({ default: () => <div>Conversation Page</div> }));
vi.mock("../pages/FollowerFollowingLists", () => ({ default: () => <div>FollowerFollowingLists Page</div> }));

vi.mock("@shared/core/components/Header", () => ({ default: () => <div>Header Component</div> }));

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
    window.history.pushState({}, "New Recipe", "/recipes/new");
    useAuth.mockReturnValue({ user: null });
    render(<App />);
    expect(await screen.findByText("Login Page")).toBeInTheDocument();
  });

  it("renders CanteenHome when authenticated at /", async () => {
    window.history.pushState({}, "Home", "/");
    useAuth.mockReturnValue({ user: { username: "testuser", permissions: [] } });
    render(<App />);
    expect(await screen.findByText("CanteenHome Page")).toBeInTheDocument();
  });

  it("renders RecipeSearch at /recipes", async () => {
    window.history.pushState({}, "RecipeSearch", "/recipes");
    useAuth.mockReturnValue({ user: { username: "testuser", permissions: [] } });
    render(<App />);
    expect(await screen.findByText("RecipeSearch Page")).toBeInTheDocument();
  });

  it("renders RecipeDetail page", async () => {
    window.history.pushState({}, "Recipe", "/recipes/123");
    useAuth.mockReturnValue({ user: { username: "testuser", permissions: [] } });
    render(<App />);
    expect(await screen.findByText("RecipeDetail Page")).toBeInTheDocument();
  });

  it("renders UserProfile page", async () => {
    window.history.pushState({}, "User", "/user/123");
    useAuth.mockReturnValue({ user: { username: "testuser", permissions: [] } });
    render(<App />);
    expect(await screen.findByText("UserProfile Page")).toBeInTheDocument();
  });

  it("renders NewRecipe page when authenticated", async () => {
    window.history.pushState({}, "New Recipe", "/recipes/new");
    useAuth.mockReturnValue({ user: { username: "testuser", permissions: ["write_data"] } });
    render(<App />);
    expect(await screen.findByText("NewRecipe Page")).toBeInTheDocument();
  });

  it("renders EditRecipe page when authenticated", async () => {
    window.history.pushState({}, "Edit Recipe", "/recipes/123/edit");
    useAuth.mockReturnValue({ user: { username: "testuser", permissions: ["write_data"] } });
    render(<App />);
    expect(await screen.findByText("EditRecipe Page")).toBeInTheDocument();
  });

  it("redirects guest from NewRecipe to Login", async () => {
    window.history.pushState({}, "New Recipe", "/recipes/new");
    useAuth.mockReturnValue({ user: { username: "guest", permissions: [] } });
    render(<App />);
    expect(screen.queryByText("NewRecipe Page")).not.toBeInTheDocument();
    expect(await screen.findByText("Login Page")).toBeInTheDocument();
  });

  it("renders MyLists page when authenticated", async () => {
    window.history.pushState({}, "My Lists", "/my-lists");
    useAuth.mockReturnValue({ user: { username: "testuser", permissions: [] } });
    render(<App />);
    expect(await screen.findByText("MyLists Page")).toBeInTheDocument();
  });

  it("renders ListView page when authenticated", async () => {
    window.history.pushState({}, "List View", "/my-lists/1");
    useAuth.mockReturnValue({ user: { username: "testuser", permissions: [] } });
    render(<App />);
    expect(await screen.findByText("ListView Page")).toBeInTheDocument();
  });

  it("renders Messages page when authenticated", async () => {
    window.history.pushState({}, "Messages", "/messages");
    useAuth.mockReturnValue({ user: { username: "testuser", permissions: [] } });
    render(<App />);
    expect(await screen.findByText("Messages Page")).toBeInTheDocument();
  });

  it("renders Conversation page when authenticated", async () => {
    window.history.pushState({}, "Conversation", "/messages/123");
    useAuth.mockReturnValue({ user: { username: "testuser", permissions: [] } });
    render(<App />);
    expect(await screen.findByText("Conversation Page")).toBeInTheDocument();
  });

  it("renders FollowerFollowingLists page when authenticated", async () => {
    window.history.pushState({}, "Network", "/user/123/network");
    useAuth.mockReturnValue({ user: { username: "testuser", permissions: [] } });
    render(<App />);
    expect(await screen.findByText("FollowerFollowingLists Page")).toBeInTheDocument();
  });

  it("renders 404 for unknown routes when authenticated", async () => {
    window.history.pushState({}, "404", "/random-route");
    useAuth.mockReturnValue({ user: { username: "testuser", permissions: [] } });
    render(<App />);
    expect(await screen.findByText("NotFound Page")).toBeInTheDocument();
  });
});