import { MemoryRouter } from "react-router-dom";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import NoteList from "../NoteList";

describe("NoteList", () => {
  const notes = [
    { id: "n1", title: "Groceries", content: "Eggs", createdAt: "2026-03-15T12:00:00Z" },
    { id: "n2", title: "", content: "No title here", createdAt: "2026-03-16T12:00:00Z" },
  ];

  const renderComponent = (props = {}) =>
    render(
      <MemoryRouter>
        <NoteList fetchingNotes={false} notes={notes} emptyMessage="No notes." {...props} />
      </MemoryRouter>,
    );

  it("shows a loading state", () => {
    renderComponent({ fetchingNotes: true });
    expect(screen.getByText("Loading notes...")).toBeInTheDocument();
  });

  it("shows the empty message when there are no notes", () => {
    renderComponent({ notes: [] });
    expect(screen.getByText("No notes.")).toBeInTheDocument();
  });

  it("renders notes with links to their detail pages", () => {
    renderComponent();
    expect(screen.getByText("Groceries")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "View Groceries" })).toHaveAttribute(
      "href",
      "/notes/n1",
    );
  });

  it("falls back to Untitled for notes without a title", () => {
    renderComponent();
    expect(screen.getByText("Untitled")).toBeInTheDocument();
  });

  it("calls handleDeleteNote with the note id", () => {
    const handleDeleteNote = vi.fn();
    renderComponent({ handleDeleteNote });

    fireEvent.click(screen.getByLabelText("Delete Groceries"));
    expect(handleDeleteNote).toHaveBeenCalledWith(expect.anything(), "n1");
  });

  it("hides delete buttons when handleDeleteNote is not provided", () => {
    renderComponent({ handleDeleteNote: undefined });
    expect(screen.queryByLabelText("Delete Groceries")).not.toBeInTheDocument();
  });
});
