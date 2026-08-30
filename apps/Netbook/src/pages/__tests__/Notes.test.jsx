import { MemoryRouter } from "react-router-dom";
import { onlineManager, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useAuth } from "@shared/core/hooks/useAuth";
import * as netbookApi from "@shared/core/services/netbookApi";

import { getDraft, NEW_NOTE_DRAFT_KEY, saveDraft } from "../../offline/noteDrafts";
import Notes from "../Notes";

vi.mock("@shared/core/hooks/useAuth");
vi.mock("@shared/core/services/netbookApi");

const paged = (items, overrides = {}) => ({
  items,
  page: 1,
  pageSize: 10,
  total: items.length,
  totalPages: 1,
  ...overrides,
});

describe("Notes", () => {
  let queryClient;
  const notes = [
    {
      id: "n1",
      title: "Older",
      content: "Old content",
      createdAt: "2026-01-01T00:00:00Z",
      updatedAt: "u1",
    },
    {
      id: "n2",
      title: "Newer",
      content: "New content",
      createdAt: "2026-02-01T00:00:00Z",
      updatedAt: "u2",
    },
  ];

  const renderComponent = () =>
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <Notes />
        </MemoryRouter>
      </QueryClientProvider>,
    );

  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    useAuth.mockReturnValue({ user: { username: "testuser", permissions: [] } });
    netbookApi.fetchNotes.mockResolvedValue(paged(notes));
    netbookApi.createNote.mockResolvedValue({ id: "n3" });
    netbookApi.updateNote.mockResolvedValue({});
    netbookApi.deleteNote.mockResolvedValue({});
  });

  afterEach(() => {
    onlineManager.setOnline(true);
  });

  it("renders the notebook for a signed-in user", async () => {
    renderComponent();
    expect(await screen.findByText("Older")).toBeInTheDocument();
    expect(screen.getByText("Newer")).toBeInTheDocument();
    expect(screen.getByText("My Notes")).toBeInTheDocument();
  });

  it("reveals the inline form and creates a note", async () => {
    renderComponent();
    await waitFor(() => expect(screen.getByText("Older")).toBeInTheDocument());

    fireEvent.click(screen.getByText("+ New note"));
    fireEvent.change(screen.getByPlaceholderText("e.g. Reading List"), {
      target: { value: "Fresh note" },
    });
    fireEvent.click(screen.getByText("Create Note"));

    await waitFor(() =>
      expect(netbookApi.createNote).toHaveBeenCalledWith({ title: "Fresh note", content: "" }),
    );
  });

  it("paginates with Prev/Next", async () => {
    netbookApi.fetchNotes.mockImplementation((page) =>
      Promise.resolve(
        paged(page === 1 ? [notes[1]] : [notes[0]], { page, total: 2, totalPages: 2 }),
      ),
    );
    renderComponent();

    await waitFor(() => expect(screen.getByText("Page 1 of 2")).toBeInTheDocument());
    expect(screen.getByText("Newer")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Next ›"));

    await waitFor(() => expect(netbookApi.fetchNotes).toHaveBeenCalledWith(2));
    expect(await screen.findByText("Page 2 of 2")).toBeInTheDocument();
  });

  it("opens the delete modal and deletes a note", async () => {
    renderComponent();
    await waitFor(() => expect(screen.getByText("Newer")).toBeInTheDocument());

    fireEvent.click(screen.getByLabelText("Delete Newer"));
    expect(screen.getByText("Delete Note")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Delete"));
    await waitFor(() => expect(netbookApi.deleteNote).toHaveBeenCalledWith("n2"));
  });

  it("saves a create locally when offline and marks it unsynced", async () => {
    onlineManager.setOnline(false);
    renderComponent();

    fireEvent.click(await screen.findByText("+ New note"));
    fireEvent.change(screen.getByPlaceholderText("e.g. Reading List"), {
      target: { value: "Offline note" },
    });
    fireEvent.click(screen.getByText("Create Note"));

    expect(await screen.findByText("Offline note")).toBeInTheDocument();
    expect(screen.getByText("● unsynced")).toBeInTheDocument();
    expect(screen.getByText(/1 change saved offline/)).toBeInTheDocument();
    expect(netbookApi.createNote).not.toHaveBeenCalled();
  });

  it("edits a pending note without any network call", async () => {
    onlineManager.setOnline(false);
    renderComponent();

    fireEvent.click(await screen.findByText("+ New note"));
    fireEvent.change(screen.getByPlaceholderText("e.g. Reading List"), {
      target: { value: "Offline note" },
    });
    fireEvent.click(screen.getByText("Create Note"));
    await screen.findByText("Offline note");

    fireEvent.click(screen.getByLabelText("Edit Offline note"));
    fireEvent.change(screen.getByDisplayValue("Offline note"), {
      target: { value: "Offline note v2" },
    });
    fireEvent.click(screen.getByText("Save Note"));

    expect(await screen.findByText("Offline note v2")).toBeInTheDocument();
    expect(netbookApi.createNote).not.toHaveBeenCalled();
    expect(netbookApi.updateNote).not.toHaveBeenCalled();
    // Still a single coalesced pending change.
    expect(screen.getByText(/1 change saved offline/)).toBeInTheDocument();
  });

  it("queues an edit to a server note when offline", async () => {
    renderComponent();
    await screen.findByText("Older");
    onlineManager.setOnline(false);

    fireEvent.click(screen.getByLabelText("Edit Older"));
    fireEvent.change(screen.getByDisplayValue("Older"), { target: { value: "Older edited" } });
    fireEvent.click(screen.getByText("Save Note"));

    expect(await screen.findByText("Older edited")).toBeInTheDocument();
    expect(screen.getByText("● unsynced")).toBeInTheDocument();
    expect(netbookApi.updateNote).not.toHaveBeenCalled();
  });

  it("deletes a server note locally when offline", async () => {
    renderComponent();
    await screen.findByText("Newer");
    onlineManager.setOnline(false);

    fireEvent.click(screen.getByLabelText("Delete Newer"));
    fireEvent.click(screen.getByText("Delete"));

    await waitFor(() => expect(screen.queryByText("Newer")).not.toBeInTheDocument());
    expect(netbookApi.deleteNote).not.toHaveBeenCalled();
    expect(screen.getByText(/1 change saved offline/)).toBeInTheDocument();
  });

  it("falls back to the offline queue when a create fails at the network level", async () => {
    netbookApi.createNote.mockRejectedValue(new Error("Network Error"));
    renderComponent();
    await screen.findByText("Older");

    fireEvent.click(screen.getByText("+ New note"));
    fireEvent.change(screen.getByPlaceholderText("e.g. Reading List"), {
      target: { value: "Flaky note" },
    });
    fireEvent.click(screen.getByText("Create Note"));

    expect(await screen.findByText("Flaky note")).toBeInTheDocument();
    expect(screen.getByText("● unsynced")).toBeInTheDocument();
  });

  it("reopens the new-note form with a surviving draft after a reload", async () => {
    saveDraft(NEW_NOTE_DRAFT_KEY, { title: "Interrupted", content: "mid-sentence" });
    renderComponent();

    expect(await screen.findByDisplayValue("Interrupted")).toBeInTheDocument();
    expect(screen.getByDisplayValue("mid-sentence")).toBeInTheDocument();
  });

  it("clears the new-note draft once the note is created", async () => {
    renderComponent();
    await waitFor(() => expect(screen.getByText("Older")).toBeInTheDocument());

    fireEvent.click(screen.getByText("+ New note"));
    fireEvent.change(screen.getByPlaceholderText("e.g. Reading List"), {
      target: { value: "Fresh note" },
    });
    expect(getDraft(NEW_NOTE_DRAFT_KEY)).not.toBeNull();

    fireEvent.click(screen.getByText("Create Note"));

    await waitFor(() => expect(getDraft(NEW_NOTE_DRAFT_KEY)).toBeNull());
  });

  it("clears the new-note draft when a create is queued offline", async () => {
    onlineManager.setOnline(false);
    renderComponent();

    fireEvent.click(await screen.findByText("+ New note"));
    fireEvent.change(screen.getByPlaceholderText("e.g. Reading List"), {
      target: { value: "Offline note" },
    });
    fireEvent.click(screen.getByText("Create Note"));

    await screen.findByText("Offline note");
    expect(getDraft(NEW_NOTE_DRAFT_KEY)).toBeNull();
  });
});
