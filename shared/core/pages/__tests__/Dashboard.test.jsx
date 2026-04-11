import { lazy } from "react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { useAuth } from "../../hooks/useAuth";
import { navMeta } from "../../utils/constants";
import Dashboard from "../Dashboard";

vi.mock("../../hooks/useAuth");

describe("Dashboard Component", () => {
  it("renders the header with user information", () => {
    useAuth.mockReturnValue({
      user: { username: "testuser" },
      logout: vi.fn(),
    });

    render(
      <MemoryRouter>
        <Dashboard navMeta={navMeta.midden} />
      </MemoryRouter>,
    );

    expect(screen.getByText("Midden")).toBeInTheDocument();
    expect(screen.getByText("testuser")).toBeInTheDocument();
  });

  it("renders child content via Outlet", () => {
    useAuth.mockReturnValue({
      user: { username: "testuser" },
      logout: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={["/"]}>
        <Routes>
          <Route path="/" element={<Dashboard navMeta={navMeta.midden} />}>
            <Route index element={<div>Test Content</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText("Test Content")).toBeInTheDocument();
  });

  it("renders Loading fallback when child route is suspending", () => {
    useAuth.mockReturnValue({
      user: { username: "testuser" },
      logout: vi.fn(),
    });

    const LazyContent = lazy(() => new Promise(() => {})); // Never resolves

    render(
      <MemoryRouter initialEntries={["/"]}>
        <Routes>
          <Route path="/" element={<Dashboard navMeta={navMeta.midden} />}>
            <Route index element={<LazyContent />} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });
});
