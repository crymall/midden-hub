import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { getDraft, saveDraft } from "../../offline/noteDrafts";
import NoteForm from "../NoteForm";

describe("NoteForm", () => {
  const onSubmit = vi.fn();
  const onCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
  });

  const renderComponent = (props = {}) =>
    render(
      <NoteForm
        onSubmit={onSubmit}
        onCancel={onCancel}
        loading={false}
        submitLabel="Create Note"
        {...props}
      />,
    );

  it("submits the entered title and content", () => {
    renderComponent();

    fireEvent.change(screen.getByPlaceholderText("e.g. Reading List"), {
      target: { value: "Ideas" },
    });
    fireEvent.change(screen.getByPlaceholderText("Write your note..."), {
      target: { value: "Some ideas" },
    });
    fireEvent.click(screen.getByText("Create Note"));

    expect(onSubmit).toHaveBeenCalledWith({ title: "Ideas", content: "Some ideas" });
  });

  it("prefills fields from initialNote", () => {
    renderComponent({ initialNote: { title: "Groceries", content: "Eggs" } });

    expect(screen.getByDisplayValue("Groceries")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Eggs")).toBeInTheDocument();
  });

  it("calls onCancel when cancel is clicked", () => {
    renderComponent();
    fireEvent.click(screen.getByText("Cancel"));
    expect(onCancel).toHaveBeenCalled();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("disables submit and shows saving state while loading", () => {
    renderComponent({ loading: true });

    const submitBtn = screen.getByText("Saving...");
    expect(submitBtn).toBeDisabled();
    expect(screen.queryByText("Create Note")).not.toBeInTheDocument();
  });

  it("persists a draft on every change when draftKey is set", () => {
    renderComponent({ draftKey: "new" });

    fireEvent.change(screen.getByPlaceholderText("e.g. Reading List"), {
      target: { value: "Half-written" },
    });
    fireEvent.change(screen.getByPlaceholderText("Write your note..."), {
      target: { value: "thought" },
    });

    expect(getDraft("new")).toMatchObject({ title: "Half-written", content: "thought" });
  });

  it("restores a saved draft over initialNote", () => {
    saveDraft("n1", { title: "Draft title", content: "Draft content" });

    renderComponent({ draftKey: "n1", initialNote: { title: "Groceries", content: "Eggs" } });

    expect(screen.getByDisplayValue("Draft title")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Draft content")).toBeInTheDocument();
  });

  it("does not touch storage without a draftKey", () => {
    renderComponent();

    fireEvent.change(screen.getByPlaceholderText("e.g. Reading List"), {
      target: { value: "Ephemeral" },
    });

    expect(window.localStorage.getItem("netbook-note-drafts")).toBeNull();
  });
});
