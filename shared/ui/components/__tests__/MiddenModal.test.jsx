import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import MiddenModal from "../MiddenModal";

// eslint-disable-next-line no-undef
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

describe("MiddenModal", () => {
  it("renders children and title when open", async () => {
    render(
      <MiddenModal isOpen={true} onClose={() => {}} title="Test Modal">
        <div>Modal Content</div>
      </MiddenModal>
    );
    await waitFor(() => {
      expect(screen.getByText("Test Modal")).toBeInTheDocument();
      expect(screen.getByText("Modal Content")).toBeInTheDocument();
    });
  });

  it("does not render when closed", async () => {
    render(
      <MiddenModal isOpen={false} onClose={() => {}} title="Test Modal">
        <div>Modal Content</div>
      </MiddenModal>
    );
    await waitFor(() => {
      expect(screen.queryByText("Test Modal")).not.toBeInTheDocument();
      expect(screen.queryByText("Modal Content")).not.toBeInTheDocument();
    });
  });
});