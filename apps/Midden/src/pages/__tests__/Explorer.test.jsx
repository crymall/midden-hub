import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect } from "vitest";
import Explorer from "../Explorer";
import { explorerLinkList } from "../../utils/constants";

describe("Explorer Component", () => {
  it("renders all explorer links", () => {
    render(
      <MemoryRouter>
        <Explorer />
      </MemoryRouter>
    );
    explorerLinkList.forEach((item) => {
      const link = screen.getByRole("link", { name: item.label });
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute("href", item.to);
    });
  });
});