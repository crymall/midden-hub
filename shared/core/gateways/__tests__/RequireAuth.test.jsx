import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { useAuth } from "../../hooks/useAuth";
import RequireAuth from "../RequireAuth";

vi.mock("../../hooks/useAuth");

describe("RequireAuth Gateway", () => {
  it("renders loading component when isLoading is true", () => {
    useAuth.mockReturnValue({ isLoading: true, user: null });

    render(
      <MemoryRouter initialEntries={["/restricted"]}>
        <Routes>
          <Route element={<RequireAuth />}>
            <Route path="/restricted" element={<div>Restricted Content</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText("Verifying session...")).toBeInTheDocument();
    expect(screen.queryByText("Restricted Content")).not.toBeInTheDocument();
  });

  it("renders outlet content if user is signed in", () => {
    useAuth.mockReturnValue({
      user: { username: "regularUser" },
      isLoading: false,
    });

    render(
      <MemoryRouter initialEntries={["/restricted"]}>
        <Routes>
          <Route element={<RequireAuth />}>
            <Route path="/restricted" element={<div>Restricted Content</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText("Restricted Content")).toBeInTheDocument();
  });

  it("redirects to login with the origin in route state if user is null", () => {
    useAuth.mockReturnValue({ user: null, isLoading: false });

    const Login = () => {
      const location = useLocation();
      return (
        <div>
          Login Page
          <span data-testid="from-state">{location.state?.from?.pathname}</span>
        </div>
      );
    };

    render(
      <MemoryRouter initialEntries={["/restricted"]}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<RequireAuth />}>
            <Route path="/restricted" element={<div>Restricted Content</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText("Login Page")).toBeInTheDocument();
    expect(screen.getByTestId("from-state")).toHaveTextContent("/restricted");
  });
});
