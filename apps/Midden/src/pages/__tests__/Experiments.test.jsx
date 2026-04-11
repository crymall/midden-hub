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
      const link = screen.getByRole("link", { name: item.label });
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute("href", item.to);
    });
  });
});
