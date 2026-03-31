import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect, vi } from "vitest";
import Explorer from "../Explorer";
import { explorerLinkList } from "@shared/core/utils/constants";

vi.mock("@shared/core/utils/constants", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    explorerLinkList: actual.explorerLinkList.map((item) =>
      item.label === "Canteen" ? { ...item, to: "http://mock-canteen.url" } : item
    ),
  };
});

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