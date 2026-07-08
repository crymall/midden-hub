import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import * as netbookApi from "@shared/core/services/netbookApi";

import Notes from "../Notes";

const mockNavigate = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock("@shared/core/services/netbookApi");

describe("Notes", () => {
  let queryClient;
  const defaultNotes = [
    { id: "n1", title: "Older", content: "Old content", createdAt: "2026-01-01T00:00:00Z" },
    { id: "n2", title: "Newer", content: "New content", createdAt: "2026-02-01T00:00:00Z" },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockClear();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    netbookApi.fetchNotes.mockResolvedValue(defaultNotes);
  });

  const renderComponent = () =>
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <Notes />
        </MemoryRouter>
      </QueryClientProvider>,
    );

  it("renders notes", async () => {
    renderComponent();
    await waitFor(() => expect(screen.getByText("Older")).toBeInTheDocument());
    expect(screen.getByText("Newer")).toBeInTheDocument();
  });

  it("sorts notes newest first", async () => {
    renderComponent();
    await waitFor(() => expect(screen.getByText("Older")).toBeInTheDocument());

    const headings = screen.getAllByRole("heading", { level: 3 });
    expect(headings[0]).toHaveTextContent("Newer");
    expect(headings[1]).toHaveTextContent("Older");
  });

  it("shows empty message when there are no notes", async () => {
    netbookApi.fetchNotes.mockResolvedValue([]);
    renderComponent();
    await waitFor(() =>
      expect(screen.getByText("You haven't written any notes yet.")).toBeInTheDocument(),
    );
  });

  it("navigates to new note page", async () => {
    renderComponent();
    await waitFor(() => expect(screen.getByText("Older")).toBeInTheDocument());

    fireEvent.click(screen.getByText("+ Note"));
    expect(mockNavigate).toHaveBeenCalledWith("/notes/new");
  });

  it("opens delete modal and deletes note", async () => {
    netbookApi.deleteNote.mockResolvedValue({});
    renderComponent();

    await waitFor(() => expect(screen.getByText("Newer")).toBeInTheDocument());

    fireEvent.click(screen.getByLabelText("Delete Newer"));

    expect(screen.getByText("Delete Note")).toBeInTheDocument();
    expect(screen.getByText(/Are you sure you want to delete this note/)).toBeInTheDocument();

    fireEvent.click(screen.getByText("Delete"));

    await waitFor(() => {
      expect(netbookApi.deleteNote).toHaveBeenCalledWith("n2");
    });
  });

  it("closes delete modal on cancel without deleting", async () => {
    renderComponent();

    await waitFor(() => expect(screen.getByText("Newer")).toBeInTheDocument());

    fireEvent.click(screen.getByLabelText("Delete Newer"));
    fireEvent.click(screen.getByText("Cancel"));

    await waitFor(() => {
      expect(screen.queryByText("Delete Note")).not.toBeInTheDocument();
    });
    expect(netbookApi.deleteNote).not.toHaveBeenCalled();
  });
});
