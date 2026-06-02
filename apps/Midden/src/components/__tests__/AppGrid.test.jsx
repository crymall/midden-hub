import { MemoryRouter } from "react-router-dom";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import AppGrid from "../AppGrid";

describe("AppGrid Component", () => {
  const items = [
    { to: "/app1", symbol: "A", label: "App 1" },
    { to: "/app2", symbol: "B", label: "App 2" },
  ];

  it("renders multiple AppCards", () => {
    render(
      <MemoryRouter>
        <AppGrid items={items} />
      </MemoryRouter>,
    );

    expect(screen.getByText("App 1")).toBeInTheDocument();
    expect(screen.getByText("App 2")).toBeInTheDocument();
    expect(screen.getAllByRole("link").length).toBe(2);
  });
});
