import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import * as netbookApi from "@shared/core/services/netbookApi";

import NewNote from "../NewNote";

const mockNavigate = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock("@shared/core/services/netbookApi");

describe("NewNote", () => {
  let queryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockClear();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
  });

  const renderComponent = () =>
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <NewNote />
        </MemoryRouter>
      </QueryClientProvider>,
    );

  it("creates a note and navigates to it", async () => {
    netbookApi.createNote.mockResolvedValue({ id: "n9", title: "Ideas", content: "Some ideas" });
    renderComponent();

    fireEvent.change(screen.getByPlaceholderText("e.g. Reading List"), {
      target: { value: "Ideas" },
    });
    fireEvent.change(screen.getByPlaceholderText("Write your note..."), {
      target: { value: "Some ideas" },
    });
    fireEvent.click(screen.getByText("Create Note"));

    await waitFor(() => {
      expect(netbookApi.createNote).toHaveBeenCalledWith({
        title: "Ideas",
        content: "Some ideas",
      });
    });
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/notes/n9");
    });
  });

  it("navigates back on cancel", () => {
    renderComponent();
    fireEvent.click(screen.getByText("Cancel"));
    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });
});
