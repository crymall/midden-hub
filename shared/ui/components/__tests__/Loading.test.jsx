import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import Loading from "../Loading";

describe("Loading Component", () => {
  it("renders default loading message", () => {
    render(<Loading />);
    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("renders custom loading message when prop is provided", () => {
    render(<Loading message="Fetching data..." />);
    expect(screen.getByText("Fetching data...")).toBeInTheDocument();
  });
});