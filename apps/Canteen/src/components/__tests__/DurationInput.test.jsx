import { render, screen, fireEvent, act } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import DurationInput from "../DurationInput";

// eslint-disable-next-line no-undef
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

describe("DurationInput", () => {
  it("renders correctly with label", () => {
    render(<DurationInput label="Prep Time" onChange={() => {}} />);
    expect(screen.getByText("Prep Time")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("e.g. 15")).toBeInTheDocument();
    expect(screen.getByText("Minutes")).toBeInTheDocument();
  });

  it("calls onChange with correct value when input changes (Minutes)", async () => {
    const handleChange = vi.fn();
    render(<DurationInput label="Prep Time" onChange={handleChange} />);

    const input = screen.getByPlaceholderText("e.g. 15");
    await act(async () => {
      fireEvent.change(input, { target: { value: "30" } });
    });

    expect(handleChange).toHaveBeenCalledWith(30);
  });

  it("calls onChange with correct value when unit changes to Hours", async () => {
    const handleChange = vi.fn();
    render(<DurationInput label="Prep Time" onChange={handleChange} />);

    const input = screen.getByPlaceholderText("e.g. 15");
    await act(async () => {
      fireEvent.change(input, { target: { value: "2" } });
    });
    
    expect(handleChange).toHaveBeenLastCalledWith(2);

    const button = screen.getByRole("button");
    await act(async () => {
      fireEvent.click(button);
    });
    
    const hoursOption = screen.getByText("Hours");
    await act(async () => {
      fireEvent.click(hoursOption);
    });

    expect(handleChange).toHaveBeenLastCalledWith(120);
  });

  it("calls onChange with correct value when input changes while Hours is selected", async () => {
    const handleChange = vi.fn();
    render(<DurationInput label="Prep Time" onChange={handleChange} />);

    const button = screen.getByRole("button");
    await act(async () => {
      fireEvent.click(button);
    });
    const hoursOption = screen.getByText("Hours");
    await act(async () => {
      fireEvent.click(hoursOption);
    });

    const input = screen.getByPlaceholderText("e.g. 15");
    await act(async () => {
      fireEvent.change(input, { target: { value: "1.5" } });
    });

    expect(handleChange).toHaveBeenLastCalledWith(90);
  });

  it("handles invalid input gracefully", async () => {
    const handleChange = vi.fn();
    render(<DurationInput label="Prep Time" onChange={handleChange} />);

    const input = screen.getByPlaceholderText("e.g. 15");
    await act(async () => {
      fireEvent.change(input, { target: { value: "1" } });
    });
    await act(async () => {
      fireEvent.change(input, { target: { value: "" } });
    });

    expect(handleChange).toHaveBeenCalledWith(0);
  });
});