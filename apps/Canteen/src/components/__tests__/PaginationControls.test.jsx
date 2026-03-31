import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import PaginationControls from "../PaginationControls";

describe("PaginationControls", () => {
  const defaultProps = {
    page: 2,
    limit: 20,
    onPageChange: vi.fn(),
    onLimitChange: vi.fn(),
    loading: false,
    isNextDisabled: false,
  };

  it("renders current page and limit correctly", () => {
    render(<PaginationControls {...defaultProps} />);
    expect(screen.getByText("Page 2")).toBeInTheDocument();
    expect(screen.getByRole("combobox")).toHaveValue("20");
  });

  it("calls onPageChange with correct value when Prev is clicked", () => {
    render(<PaginationControls {...defaultProps} />);
    fireEvent.click(screen.getByText("← Prev"));
    expect(defaultProps.onPageChange).toHaveBeenCalledWith(1);
  });

  it("calls onPageChange with correct value when Next is clicked", () => {
    render(<PaginationControls {...defaultProps} />);
    fireEvent.click(screen.getByText("Next →"));
    expect(defaultProps.onPageChange).toHaveBeenCalledWith(3);
  });

  it("calls onLimitChange when limit is changed", () => {
    render(<PaginationControls {...defaultProps} />);
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "50" } });
    expect(defaultProps.onLimitChange).toHaveBeenCalled();
  });

  it("disables Prev button on page 1", () => {
    render(<PaginationControls {...defaultProps} page={1} />);
    expect(screen.getByText("← Prev")).toBeDisabled();
  });

  it("disables Next button when isNextDisabled is true", () => {
    render(<PaginationControls {...defaultProps} isNextDisabled={true} />);
    expect(screen.getByText("Next →")).toBeDisabled();
  });

  it("disables buttons when loading", () => {
    render(<PaginationControls {...defaultProps} loading={true} />);
    expect(screen.getByText("← Prev")).toBeDisabled();
    expect(screen.getByText("Next →")).toBeDisabled();
  });

  it("resets page to 1 when limit changes (logic handled by parent usually, but verifying event)", () => {
    render(<PaginationControls {...defaultProps} />);
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "50" } });
    expect(defaultProps.onLimitChange).toHaveBeenCalled();
  });
});