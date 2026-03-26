import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect } from "vitest";
import Experiments from "../Experiments";
import { experimentLinkList } from "../../utils/constants";

describe("Experiments Component", () => {
  it("renders all experiment links", () => {
    render(
      <MemoryRouter>
        <Experiments />
      </MemoryRouter>
    );
    experimentLinkList.forEach((item) => {
      const link = screen.getByRole("link", { name: item.label });
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute("href", item.to);
    });
  });
});