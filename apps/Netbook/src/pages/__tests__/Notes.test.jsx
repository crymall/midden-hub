import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useAuth } from "@shared/core/hooks/useAuth";
import * as netbookApi from "@shared/core/services/netbookApi";

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
    { id: "n1", title: "Older", content: "Old content", createdAt: "2026-01-01T00:00:00Z" },
    { id: "n2", title: "Newer", content: "New content", createdAt: "2026-02-01T00:00:00Z" },
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
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    useAuth.mockReturnValue({ user: { username: "testuser", permissions: [] } });
    netbookApi.fetchNotes.mockResolvedValue(paged(notes));
    netbookApi.createNote.mockResolvedValue({ id: "n3" });
    netbookApi.deleteNote.mockResolvedValue({});
  });

  it("shows the splash and no note list for logged-out visitors", async () => {
    useAuth.mockReturnValue({ user: null });
    renderComponent();
    expect(await screen.findByText("Login or Register")).toBeInTheDocument();
    expect(screen.queryByText("My Notes")).not.toBeInTheDocument();
    expect(netbookApi.fetchNotes).not.toHaveBeenCalled();
  });

  it("treats the guest account as logged-out", async () => {
    useAuth.mockReturnValue({ user: { username: "guest", permissions: [] } });
    renderComponent();
    expect(await screen.findByText("Login or Register")).toBeInTheDocument();
    expect(screen.queryByText("My Notes")).not.toBeInTheDocument();
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
});
