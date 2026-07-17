import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import NoteList from "../NoteList";

describe("NoteList", () => {
  const notes = [
    { id: "n1", title: "Groceries", content: "Eggs", createdAt: "2026-03-15T12:00:00Z" },
    { id: "n2", title: "", content: "No title here", createdAt: "2026-03-16T12:00:00Z" },
  ];

  const renderComponent = (props = {}) =>
    render(
      <NoteList
        fetchingNotes={false}
        notes={notes}
        emptyMessage="No notes."
        onUpdateNote={vi.fn().mockResolvedValue({})}
        updating={false}
        {...props}
      />,
    );

  it("shows a loading state", () => {
    renderComponent({ fetchingNotes: true });
    expect(screen.getByText("Loading notes...")).toBeInTheDocument();
  });

  it("shows the empty message when there are no notes", () => {
    renderComponent({ notes: [] });
    expect(screen.getByText("No notes.")).toBeInTheDocument();
  });

  it("renders note titles", () => {
    renderComponent();
    expect(screen.getByText("Groceries")).toBeInTheDocument();
  });

  it("keeps note content collapsed until the note is expanded", () => {
    renderComponent();
    expect(screen.queryByText("Eggs")).not.toBeInTheDocument();

    fireEvent.click(screen.getByText("Groceries"));
    expect(screen.getByText("Eggs")).toBeInTheDocument();
  });

  it("collapses an expanded note when clicked again", () => {
    renderComponent();
    fireEvent.click(screen.getByText("Groceries"));
    fireEvent.click(screen.getByText("Groceries"));
    expect(screen.queryByText("Eggs")).not.toBeInTheDocument();
  });

  it("falls back to Untitled for notes without a title", () => {
    renderComponent();
    expect(screen.getByText("Untitled")).toBeInTheDocument();
  });

  it("edits a note inline and calls onUpdateNote", async () => {
    const onUpdateNote = vi.fn().mockResolvedValue({});
    renderComponent({ onUpdateNote });

    fireEvent.click(screen.getByLabelText("Edit Groceries"));
    // The shared form appears, pre-filled with the note.
    const titleInput = screen.getByDisplayValue("Groceries");
    fireEvent.change(titleInput, { target: { value: "Groceries updated" } });
    fireEvent.click(screen.getByText("Save Note"));

    await waitFor(() =>
      expect(onUpdateNote).toHaveBeenCalledWith("n1", {
        title: "Groceries updated",
        content: "Eggs",
      }),
    );
  });

  it("cancels an inline edit and returns to the read view", () => {
    renderComponent();
    fireEvent.click(screen.getByLabelText("Edit Groceries"));
    expect(screen.getByText("Save Note")).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText("Cancel editing Groceries"));
    expect(screen.queryByText("Save Note")).not.toBeInTheDocument();
    expect(screen.getByText("Eggs")).toBeInTheDocument();
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
