import { MemoryRouter } from "react-router-dom";
import { explorerLinkList } from "@shared/core/utils/constants";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import Explorer from "../Explorer";

vi.mock("@shared/core/utils/constants", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    explorerLinkList: actual.explorerLinkList.map((item) =>
      item.label === "Canteen" ? { ...item, to: "http://mock-canteen.url" } : item,
    ),
  };
});

describe("Explorer Component", () => {
  it("renders all explorer links", () => {
    render(
      <MemoryRouter>
        <Explorer />
      </MemoryRouter>,
    );
    explorerLinkList.forEach((item) => {
      expect(screen.getAllByText(item.label)[0]).toBeInTheDocument();
    });

    expect(screen.getAllByRole("link").length).toBeGreaterThanOrEqual(explorerLinkList.length);
  });
});
