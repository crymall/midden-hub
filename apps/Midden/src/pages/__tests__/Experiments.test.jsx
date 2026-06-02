import { MemoryRouter } from "react-router-dom";
import { experimentLinkList } from "@shared/core/utils/constants";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import Experiments from "../Experiments";

describe("Experiments Component", () => {
  it("renders all experiment links", () => {
    render(
      <MemoryRouter>
        <Experiments />
      </MemoryRouter>,
    );
    experimentLinkList.forEach((item) => {
      expect(screen.getAllByText(item.label)[0]).toBeInTheDocument();

      const links = screen.getAllByRole("link");
      expect(links.some((link) => link.getAttribute("href") === item.to)).toBe(true);
    });
  });
});
