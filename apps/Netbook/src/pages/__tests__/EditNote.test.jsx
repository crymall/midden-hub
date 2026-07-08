import { MemoryRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import * as netbookApi from "@shared/core/services/netbookApi";

import EditNote from "../EditNote";

const mockNavigate = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock("@shared/core/services/netbookApi");

describe("EditNote", () => {
  let queryClient;
  const defaultNote = {
    id: "n1",
    title: "Groceries",
    content: "Eggs",
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

  const renderComponent = () =>
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={["/notes/n1/edit"]}>
          <Routes>
            <Route path="/notes/:id/edit" element={<EditNote />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );

  it("prefills the form with the existing note", async () => {
    renderComponent();
    await waitFor(() => expect(screen.getByDisplayValue("Groceries")).toBeInTheDocument());
    expect(screen.getByDisplayValue("Eggs")).toBeInTheDocument();
  });

  it("shows not found when the fetch fails", async () => {
    netbookApi.fetchNote.mockRejectedValue(new Error("404"));
    renderComponent();
    await waitFor(() => expect(screen.getByText("Note not found.")).toBeInTheDocument());
  });

  it("updates the note and navigates to the detail page", async () => {
    netbookApi.updateNote.mockResolvedValue({});
    renderComponent();
    await waitFor(() => expect(screen.getByDisplayValue("Groceries")).toBeInTheDocument());

    fireEvent.change(screen.getByDisplayValue("Groceries"), {
      target: { value: "Groceries v2" },
    });
    fireEvent.click(screen.getByText("Save Note"));

    await waitFor(() => {
      expect(netbookApi.updateNote).toHaveBeenCalledWith("n1", {
        title: "Groceries v2",
        content: "Eggs",
      });
    });
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/notes/n1");
    });
  });
});
