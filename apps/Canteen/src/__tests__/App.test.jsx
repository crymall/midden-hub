import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import App from "../App";
import useAuth from "../context/auth/useAuth";

vi.mock("../context/auth/AuthProvider", () => ({
  default: ({ children }) => <>{children}</>,
}));
vi.mock("../context/data/DataProvider", () => ({
  default: ({ children }) => <>{children}</>,
}));

vi.mock("../context/auth/useAuth");

vi.mock("../pages/Login", () => ({ default: () => <div>Login Page</div> }));
vi.mock("../pages/NotFound", () => ({ default: () => <div>NotFound Page</div> }));

vi.mock("../pages/Canteen/CanteenHome", () => ({ default: () => <div>CanteenHome Page</div> }));
vi.mock("../pages/Canteen/RecipeSearch", () => ({ default: () => <div>RecipeSearch Page</div> }));
vi.mock("../pages/Canteen/RecipeDetail", () => ({ default: () => <div>RecipeDetail Page</div> }));
vi.mock("../pages/Canteen/EditRecipe", () => ({ default: () => <div>EditRecipe Page</div> }));
vi.mock("../pages/Canteen/NewRecipe", () => ({ default: () => <div>NewRecipe Page</div> }));
vi.mock("../pages/Canteen/MyLists", () => ({ default: () => <div>MyLists Page</div> }));
vi.mock("../pages/Canteen/ListView", () => ({ default: () => <div>ListView Page</div> }));
vi.mock("../pages/Canteen/UserProfile", () => ({ default: () => <div>UserProfile Page</div> }));
vi.mock("../pages/Canteen/Messages", () => ({ default: () => <div>Messages Page</div> }));
vi.mock("../pages/Canteen/Conversation", () => ({ default: () => <div>Conversation Page</div> }));
vi.mock("../pages/Canteen/FollowerFollowingLists", () => ({ default: () => <div>FollowerFollowingLists Page</div> }));

vi.mock("../components/Header", () => ({ default: () => <div>Header Component</div> }));

describe("App Routing", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders Login page at /login", () => {
    window.history.pushState({}, "Login", "/login");
    useAuth.mockReturnValue({ user: null });
    render(<App />);
    expect(screen.getByText("Login Page")).toBeInTheDocument();
  });

  it("redirects to login when accessing protected route unauthenticated", () => {
    window.history.pushState({}, "New Recipe", "/recipes/new");
    useAuth.mockReturnValue({ user: null });
    render(<App />);
    expect(screen.getByText("Login Page")).toBeInTheDocument();
  });

  it("renders CanteenHome when authenticated at /", () => {
    window.history.pushState({}, "Home", "/");
    useAuth.mockReturnValue({ user: { username: "testuser" } });
    render(<App />);
    expect(screen.getByText("CanteenHome Page")).toBeInTheDocument();
  });

  it("renders RecipeSearch at /recipes", () => {
    window.history.pushState({}, "RecipeSearch", "/recipes");
    useAuth.mockReturnValue({ user: { username: "testuser" } });
    render(<App />);
    expect(screen.getByText("RecipeSearch Page")).toBeInTheDocument();
  });

  it("renders RecipeDetail page", () => {
    window.history.pushState({}, "Recipe", "/recipes/123");
    useAuth.mockReturnValue({ user: { username: "testuser" } });
    render(<App />);
    expect(screen.getByText("RecipeDetail Page")).toBeInTheDocument();
  });

  it("renders UserProfile page", () => {
    window.history.pushState({}, "User", "/user/123");
    useAuth.mockReturnValue({ user: { username: "testuser" } });
    render(<App />);
    expect(screen.getByText("UserProfile Page")).toBeInTheDocument();
  });

  it("renders NewRecipe page when authenticated", () => {
    window.history.pushState({}, "New Recipe", "/recipes/new");
    useAuth.mockReturnValue({ user: { username: "testuser" } });
    render(<App />);
    expect(screen.getByText("NewRecipe Page")).toBeInTheDocument();
  });

  it("renders EditRecipe page when authenticated", () => {
    window.history.pushState({}, "Edit Recipe", "/recipes/123/edit");
    useAuth.mockReturnValue({ user: { username: "testuser" } });
    render(<App />);
    expect(screen.getByText("EditRecipe Page")).toBeInTheDocument();
  });

  it("redirects guest from NewRecipe to Login", () => {
    window.history.pushState({}, "New Recipe", "/recipes/new");
    useAuth.mockReturnValue({ user: { username: "guest" } });
    render(<App />);
    expect(screen.queryByText("NewRecipe Page")).not.toBeInTheDocument();
    expect(screen.getByText("Login Page")).toBeInTheDocument();
  });

  it("renders MyLists page when authenticated", () => {
    window.history.pushState({}, "My Lists", "/my-lists");
    useAuth.mockReturnValue({ user: { username: "testuser" } });
    render(<App />);
    expect(screen.getByText("MyLists Page")).toBeInTheDocument();
  });

  it("renders ListView page when authenticated", () => {
    window.history.pushState({}, "List View", "/my-lists/1");
    useAuth.mockReturnValue({ user: { username: "testuser" } });
    render(<App />);
    expect(screen.getByText("ListView Page")).toBeInTheDocument();
  });

  it("renders Messages page when authenticated", () => {
    window.history.pushState({}, "Messages", "/messages");
    useAuth.mockReturnValue({ user: { username: "testuser" } });
    render(<App />);
    expect(screen.getByText("Messages Page")).toBeInTheDocument();
  });

  it("renders Conversation page when authenticated", () => {
    window.history.pushState({}, "Conversation", "/messages/123");
    useAuth.mockReturnValue({ user: { username: "testuser" } });
    render(<App />);
    expect(screen.getByText("Conversation Page")).toBeInTheDocument();
  });

  it("renders FollowerFollowingLists page when authenticated", () => {
    window.history.pushState({}, "Network", "/user/123/network");
    useAuth.mockReturnValue({ user: { username: "testuser" } });
    render(<App />);
    expect(screen.getByText("FollowerFollowingLists Page")).toBeInTheDocument();
  });

  it("renders 404 for unknown routes when authenticated", () => {
    window.history.pushState({}, "404", "/random-route");
    useAuth.mockReturnValue({ user: { username: "testuser" } });
    render(<App />);
    expect(screen.getByText("NotFound Page")).toBeInTheDocument();
  });
});