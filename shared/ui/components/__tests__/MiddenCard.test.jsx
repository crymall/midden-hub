import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import MiddenCard from "../MiddenCard";

describe("MiddenCard Component", () => {
  it("renders children content", () => {
    render(
      <MiddenCard>
        <div data-testid="child">Child Content</div>
      </MiddenCard>
    );
    expect(screen.getByTestId("child")).toBeInTheDocument();
  });

  it("applies custom className", () => {
    const { container } = render(
      <MiddenCard className="custom-class">Content</MiddenCard>
    );
    expect(container.firstChild).toHaveClass("custom-class");
  });
});