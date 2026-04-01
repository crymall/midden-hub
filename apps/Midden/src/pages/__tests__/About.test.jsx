import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import About from "../About";

describe("About Component", () => {
  it("renders the dictionary definition correctly", () => {
    render(<About />);
    
    expect(screen.getByRole("heading", { name: "Midden" })).toBeInTheDocument();
    expect(screen.getByText("(noun) /ˈmɪdən/")).toBeInTheDocument();
    expect(screen.getByText("A dung heap.")).toBeInTheDocument();
    expect(screen.getByText("A refuse heap usually near a dwelling.")).toBeInTheDocument();
    expect(screen.getByText(/An accumulation, deposit, or soil derived from occupation/i)).toBeInTheDocument();
    expect(screen.getByText("Excerpt from the Wiktionary entry for “midden”")).toBeInTheDocument();
  });

  it("renders the explanatory paragraphs", () => {
    render(<About />);
    
    expect(screen.getByText(/In my life so far, one thing has become clear:/i)).toBeInTheDocument();
    expect(screen.getByText(/The site is broken down into two main groups/i)).toBeInTheDocument();
    expect(screen.getByText(/Please don't hesitate to/i)).toBeInTheDocument();
  });
});