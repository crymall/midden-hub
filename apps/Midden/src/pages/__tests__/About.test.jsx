import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import About from "../About";

describe("About Component", () => {
  it("renders the dictionary definition correctly", () => {
    render(<About />);

    expect(screen.getByRole("heading", { name: "Midden" })).toBeInTheDocument();
    expect(screen.getByText("(noun) /ˈmɪdən/")).toBeInTheDocument();
    expect(
      screen.getByText(/An accumulation, deposit, or soil derived from occupation/i),
    ).toBeInTheDocument();
    expect(screen.getByText("Excerpt from the Wiktionary entry for “midden”")).toBeInTheDocument();
  });

  it("renders the explanatory paragraphs", () => {
    render(<About />);

    expect(screen.getByText(/In my life so far, one thing has become clear:/i)).toBeInTheDocument();
    expect(screen.getByText(/In other words: Midden is the hub/i)).toBeInTheDocument();
    expect(screen.getByText(/Please don't hesitate to/i)).toBeInTheDocument();
  });
});
