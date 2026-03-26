import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route, useLocation } from "react-router-dom";
import { describe, it, expect, vi } from "vitest";
import RequireNotGuest from "../RequireNotGuest";
import useAuth from "../../../context/auth/useAuth";

vi.mock("../../../context/auth/useAuth");

describe("RequireNotGuest Gateway", () => {
  it("renders outlet content if user is authenticated and not guest", () => {
    useAuth.mockReturnValue({ user: { username: "regularUser" } });

    render(
      <MemoryRouter initialEntries={["/restricted"]}>
        <Routes>
          <Route element={<RequireNotGuest />}>
            <Route path="/restricted" element={<div>Restricted Content</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText("Restricted Content")).toBeInTheDocument();
  });

  it("redirects to login with state if user is guest", () => {
    useAuth.mockReturnValue({ user: { username: "guest" } });

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
          <Route element={<RequireNotGuest />}>
            <Route path="/restricted" element={<div>Restricted Content</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );
    
    expect(screen.getByText("Login Page")).toBeInTheDocument();
    expect(screen.getByTestId("from-state")).toHaveTextContent("/restricted");
  });

  it("redirects to login if user is null", () => {
    useAuth.mockReturnValue({ user: null });

    render(
      <MemoryRouter initialEntries={["/restricted"]}>
        <Routes>
          <Route path="/login" element={<div>Login Page</div>} />
          <Route element={<RequireNotGuest />}>
            <Route path="/restricted" element={<div>Restricted Content</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );
    expect(screen.getByText("Login Page")).toBeInTheDocument();
  });
});