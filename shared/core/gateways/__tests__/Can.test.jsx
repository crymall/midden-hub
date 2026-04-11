import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { useAuth } from "../../hooks/useAuth";
import { PERMISSIONS } from "../../utils/constants";
import Can from "../Can";

vi.mock("../../hooks/useAuth");

describe("Can Gateway", () => {
  it("returns null when isLoading is true", () => {
    useAuth.mockReturnValue({ isLoading: true, user: null });

    const { container } = render(<Can perform={PERMISSIONS.writeUsers}>Content</Can>);

    expect(container).toBeEmptyDOMElement();
  });

  it("renders children if user has permission", () => {
    useAuth.mockReturnValue({
      user: { permissions: [PERMISSIONS.writeUsers] },
      isLoading: false,
    });

    render(
      <Can perform={PERMISSIONS.writeUsers}>
        <div>Allowed Content</div>
      </Can>,
    );
    expect(screen.getByText("Allowed Content")).toBeInTheDocument();
  });

  it("does not render children if user lacks permission", () => {
    useAuth.mockReturnValue({
      user: { permissions: [] },
      isLoading: false,
    });

    render(
      <Can perform={PERMISSIONS.writeUsers}>
        <div>Allowed Content</div>
      </Can>,
    );
    expect(screen.queryByText("Allowed Content")).not.toBeInTheDocument();
  });

  it("returns null if no user is logged in", () => {
    useAuth.mockReturnValue({ user: null, isLoading: false });
    const { container } = render(<Can perform="any">Content</Can>);
    expect(container).toBeEmptyDOMElement();
  });
});
