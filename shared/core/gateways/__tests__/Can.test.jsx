import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import Can from "../Can";
import useAuth from "../../context/auth/useAuth";
import { PERMISSIONS } from "../../utils/constants";

vi.mock("../../context/auth/useAuth");

describe("Can Gateway", () => {
  it("renders children if user has permission", () => {
    useAuth.mockReturnValue({
      user: { permissions: [PERMISSIONS.writeUsers] },
    });

    render(
      <Can perform={PERMISSIONS.writeUsers}>
        <div>Allowed Content</div>
      </Can>
    );
    expect(screen.getByText("Allowed Content")).toBeInTheDocument();
  });

  it("does not render children if user lacks permission", () => {
    useAuth.mockReturnValue({
      user: { permissions: [] },
    });

    render(
      <Can perform={PERMISSIONS.writeUsers}>
        <div>Allowed Content</div>
      </Can>
    );
    expect(screen.queryByText("Allowed Content")).not.toBeInTheDocument();
  });

  it("returns null if no user is logged in", () => {
    useAuth.mockReturnValue({ user: null });
    const { container } = render(<Can perform="any">Content</Can>);
    expect(container).toBeEmptyDOMElement();
  });
});