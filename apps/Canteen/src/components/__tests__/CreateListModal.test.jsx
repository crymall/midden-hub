import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import CreateListModal from "../CreateListModal";

vi.mock("@shared/ui/components/MiddenModal", () => ({
  default: ({ isOpen, children, title }) => (
    isOpen ? (
      <div data-testid="midden-modal">
        <h2>{title}</h2>
        {children}
      </div>
    ) : null
  ),
}));

describe("CreateListModal", () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onCreate: vi.fn(),
    loading: false,
  };

  it("renders correctly when open", () => {
    render(<CreateListModal {...defaultProps} />);
    expect(screen.getByTestId("midden-modal")).toBeInTheDocument();
    expect(screen.getByText("Create New List")).toBeInTheDocument();
    expect(screen.getByLabelText("List Name")).toBeInTheDocument();
  });

  it("does not render when closed", () => {
    render(<CreateListModal {...defaultProps} isOpen={false} />);
    expect(screen.queryByTestId("midden-modal")).not.toBeInTheDocument();
  });

  it("calls onClose when Cancel is clicked", () => {
    render(<CreateListModal {...defaultProps} />);
    fireEvent.click(screen.getByText("Cancel"));
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it("calls onCreate with input value on submit", () => {
    render(<CreateListModal {...defaultProps} />);
    const input = screen.getByLabelText("List Name");
    fireEvent.change(input, { target: { value: "My New List" } });
    
    fireEvent.click(screen.getByText("Create List"));
    expect(defaultProps.onCreate).toHaveBeenCalledWith("My New List");
  });

  it("shows loading state", () => {
    render(<CreateListModal {...defaultProps} loading={true} />);
    const submitBtn = screen.getByText("Creating...");
    expect(submitBtn).toBeInTheDocument();
    expect(submitBtn).toBeDisabled();
  });

  it("resets input when reopened", () => {
    const { rerender } = render(<CreateListModal {...defaultProps} />);
    const input = screen.getByLabelText("List Name");
    fireEvent.change(input, { target: { value: "Dirty Input" } });
    
    rerender(<CreateListModal {...defaultProps} isOpen={false} />);
    
    rerender(<CreateListModal {...defaultProps} isOpen={true} />);
    expect(screen.getByLabelText("List Name")).toHaveValue("");
  });
});