import { MemoryRouter } from "react-router-dom";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import AppCard from "../AppCard";

describe("AppCard Component", () => {
  const defaultProps = {
    to: "/internal",
    symbol: "🍎",
    label: "Apple",
  };

  it("renders an internal link correctly", () => {
    render(
      <MemoryRouter>
        <AppCard {...defaultProps} />
      </MemoryRouter>,
    );
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/internal");
    expect(screen.getByText("🍎")).toBeInTheDocument();
    expect(screen.getByText("Apple")).toBeInTheDocument();
  });

  it("renders an external link correctly", () => {
    render(
      <MemoryRouter>
        <AppCard {...defaultProps} to="https://example.com" />
      </MemoryRouter>,
    );
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "https://example.com");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("renders description when provided", () => {
    const description = "banana";
    render(
      <MemoryRouter>
        <AppCard {...defaultProps} description={description} />
      </MemoryRouter>,
    );

    expect(screen.getByText(description)).toBeInTheDocument();
  });

  it("toggles mobile description", () => {
    const description = "banana";
    render(
      <MemoryRouter>
        <AppCard {...defaultProps} description={description} />
      </MemoryRouter>,
    );

    const expandBtn = screen.getByRole("button", { name: "Expand description" });
    expect(expandBtn).toBeInTheDocument();

    fireEvent.click(expandBtn);

    expect(screen.getByRole("button", { name: "Collapse description" })).toBeInTheDocument();
    expect(screen.getAllByText(description)).toHaveLength(2);
  });
});
