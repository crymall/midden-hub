import { MemoryRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import * as netbookApi from "@shared/core/services/netbookApi";

import NoteDetail from "../NoteDetail";

const mockNavigate = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock("@shared/core/services/netbookApi");

describe("NoteDetail", () => {
  let queryClient;
  const defaultNote = {
    id: "n1",
    title: "Groceries",
    content: "Eggs\nMilk",
    createdAt: "2026-03-15T12:00:00Z",
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockClear();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    netbookApi.fetchNote.mockResolvedValue(defaultNote);
  });

  const renderComponent = (initialEntries = ["/notes/n1"]) =>
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={initialEntries}>
          <Routes>
            <Route path="/notes/:id" element={<NoteDetail />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );

  it("renders the note", async () => {
    renderComponent();
    await waitFor(() => expect(screen.getByText("Groceries")).toBeInTheDocument());
    expect(screen.getByText(/Eggs/)).toBeInTheDocument();
    expect(netbookApi.fetchNote).toHaveBeenCalledWith("n1");
  });

  it("shows not found when the fetch fails", async () => {
    netbookApi.fetchNote.mockRejectedValue(new Error("404"));
    renderComponent();
    await waitFor(() => expect(screen.getByText("Note not found.")).toBeInTheDocument());
  });

  it("navigates to the edit page", async () => {
    renderComponent();
    await waitFor(() => expect(screen.getByText("Groceries")).toBeInTheDocument());

    fireEvent.click(screen.getByText("Edit"));
    expect(mockNavigate).toHaveBeenCalledWith("/notes/n1/edit");
  });

  it("opens delete modal, deletes note, and navigates home", async () => {
    netbookApi.deleteNote.mockResolvedValue({});
    renderComponent();
    await waitFor(() => expect(screen.getByText("Groceries")).toBeInTheDocument());

    fireEvent.click(screen.getByText("Delete"));
    expect(screen.getByText("Delete Note")).toBeInTheDocument();

    fireEvent.click(screen.getAllByText("Delete").at(-1));

    await waitFor(() => {
      expect(netbookApi.deleteNote).toHaveBeenCalledWith("n1");
    });
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/");
    });
  });
});
