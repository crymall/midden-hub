import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import Note from "../Note";

describe("Note", () => {
  const note = {
    id: "n1",
    title: "Groceries",
    content: "Eggs and milk",
    createdAt: "2026-03-15T12:00:00Z",
  };

  const renderComponent = (props = {}) =>
    render(
      <Note
        note={note}
        isExpanded={false}
        isEditing={false}
        hasUnsavedDraft={false}
        onToggleExpand={vi.fn()}
        onToggleEdit={vi.fn()}
        onEndEdit={vi.fn()}
        onUpdateNote={vi.fn().mockResolvedValue({})}
        updating={false}
        handleDeleteNote={vi.fn()}
        {...props}
      />,
    );

  it("renders the title and falls back to Untitled", () => {
    renderComponent();
    expect(screen.getByText("Groceries")).toBeInTheDocument();

    renderComponent({ note: { ...note, title: "" } });
    expect(screen.getByText("Untitled")).toBeInTheDocument();
  });

  it("shows content only when expanded", () => {
    const { rerender } = renderComponent();
    expect(screen.queryByText("Eggs and milk")).not.toBeInTheDocument();

    rerender(
      <Note
        note={note}
        isExpanded
        isEditing={false}
        hasUnsavedDraft={false}
        onToggleExpand={vi.fn()}
        onToggleEdit={vi.fn()}
        onEndEdit={vi.fn()}
        onUpdateNote={vi.fn().mockResolvedValue({})}
        updating={false}
        handleDeleteNote={vi.fn()}
      />,
    );
    expect(screen.getByText("Eggs and milk")).toBeInTheDocument();
  });

  it("renders the edit form when editing", () => {
    renderComponent({ isExpanded: true, isEditing: true });
    expect(screen.getByDisplayValue("Groceries")).toBeInTheDocument();
    expect(screen.getByText("Save Note")).toBeInTheDocument();
  });

  it("shows the unsynced and unsaved-draft markers independently", () => {
    renderComponent({ note: { ...note, pending: true } });
    expect(screen.getByText("● unsynced")).toBeInTheDocument();
    expect(screen.queryByText("● unsaved draft")).not.toBeInTheDocument();

    renderComponent({ hasUnsavedDraft: true });
    expect(screen.getByText("● unsaved draft")).toBeInTheDocument();
  });

  it("wires the expand, edit, and delete callbacks to the note id", () => {
    const onToggleExpand = vi.fn();
    const onToggleEdit = vi.fn();
    const handleDeleteNote = vi.fn();
    renderComponent({ onToggleExpand, onToggleEdit, handleDeleteNote });

    fireEvent.click(screen.getByText("Groceries"));
    expect(onToggleExpand).toHaveBeenCalledWith("n1");

    fireEvent.click(screen.getByLabelText("Edit Groceries"));
    expect(onToggleEdit).toHaveBeenCalledWith("n1");

    fireEvent.click(screen.getByLabelText("Delete Groceries"));
    expect(handleDeleteNote).toHaveBeenCalledWith(expect.anything(), "n1");
  });

  it("hides the delete button when no handler is provided", () => {
    renderComponent({ handleDeleteNote: undefined });
    expect(screen.queryByLabelText("Delete Groceries")).not.toBeInTheDocument();
  });
});
