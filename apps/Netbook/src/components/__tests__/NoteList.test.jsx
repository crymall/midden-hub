import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { getDraft, saveDraft } from "../../offline/noteDrafts";
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

  it("marks pending notes as unsynced", () => {
    renderComponent({ notes: [{ ...notes[0], pending: true }, notes[1]] });
    expect(screen.getByText("● unsynced")).toBeInTheDocument();
  });

  describe("edit drafts", () => {
    beforeEach(() => {
      window.localStorage.clear();
    });

    it("restores an in-progress edit draft when the editor reopens", () => {
      saveDraft("n1", { title: "Groceries draft", content: "Eggs and milk" });
      renderComponent();

      fireEvent.click(screen.getByLabelText("Edit Groceries"));

      expect(screen.getByDisplayValue("Groceries draft")).toBeInTheDocument();
      expect(screen.getByDisplayValue("Eggs and milk")).toBeInTheDocument();
    });

    it("clears the draft on the header Cancel", () => {
      saveDraft("n1", { title: "Groceries draft", content: "" });
      renderComponent();

      fireEvent.click(screen.getByLabelText("Edit Groceries"));
      fireEvent.click(screen.getByLabelText("Cancel editing Groceries"));

      expect(getDraft("n1")).toBeNull();
    });

    it("clears the draft on the form Cancel", () => {
      saveDraft("n1", { title: "Groceries draft", content: "" });
      renderComponent();

      fireEvent.click(screen.getByLabelText("Edit Groceries"));
      // The header toggle is labeled "Cancel editing Groceries"; this targets
      // the form's own Cancel button.
      fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

      expect(getDraft("n1")).toBeNull();
    });

    it("keeps the draft when the card is collapsed without cancelling", () => {
      saveDraft("n1", { title: "Groceries draft", content: "" });
      renderComponent();

      fireEvent.click(screen.getByLabelText("Edit Groceries"));
      // Clicking the title collapses the card — an implicit exit, not a cancel.
      fireEvent.click(screen.getByText("Groceries"));

      expect(getDraft("n1")).not.toBeNull();
    });

    it("marks a note that has a stored draft while not being edited", () => {
      saveDraft("n1", { title: "Groceries draft", content: "" });
      renderComponent();

      expect(screen.getByText("● unsaved draft")).toBeInTheDocument();
    });

    it("does not mark a note that has no draft", () => {
      renderComponent();

      expect(screen.queryByText("● unsaved draft")).not.toBeInTheDocument();
    });

    it("hides the marker while the note is actively being edited", () => {
      saveDraft("n1", { title: "Groceries draft", content: "" });
      renderComponent();

      fireEvent.click(screen.getByLabelText("Edit Groceries"));

      // The open form already shows the draft, so the marker would be redundant.
      expect(screen.queryByText("● unsaved draft")).not.toBeInTheDocument();
    });

    it("surfaces the kept draft after leaving an edit without cancelling", () => {
      renderComponent();

      fireEvent.click(screen.getByLabelText("Edit Groceries"));
      fireEvent.change(screen.getByDisplayValue("Groceries"), {
        target: { value: "Groceries in progress" },
      });
      // Collapse by clicking the title — the draft is kept, not cancelled.
      fireEvent.click(screen.getByText("Groceries"));

      expect(screen.getByText("● unsaved draft")).toBeInTheDocument();
    });

    it("removes the marker once the draft is cancelled", () => {
      saveDraft("n1", { title: "Groceries draft", content: "" });
      renderComponent();

      fireEvent.click(screen.getByLabelText("Edit Groceries"));
      fireEvent.click(screen.getByLabelText("Cancel editing Groceries"));

      expect(screen.queryByText("● unsaved draft")).not.toBeInTheDocument();
    });
  });
});
