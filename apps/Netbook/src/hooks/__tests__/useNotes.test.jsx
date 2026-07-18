import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import * as netbookApi from "@shared/core/services/netbookApi";

import { queueNoteCreate, queueNoteDelete, queueNoteUpdate } from "../../offline/pendingNotesStore";
import { useNotes } from "../useNotes";

vi.mock("@shared/core/services/netbookApi");

const paged = (items, overrides = {}) => ({
  items,
  page: 1,
  pageSize: 10,
  total: items.length,
  totalPages: 1,
  ...overrides,
});

describe("useNotes", () => {
  let queryClient;
  const serverNotes = [
    { id: "n1", title: "One", content: "C1", createdAt: "2026-01-01T00:00:00Z", updatedAt: "u1" },
    { id: "n2", title: "Two", content: "C2", createdAt: "2026-02-01T00:00:00Z", updatedAt: "u2" },
  ];

  const wrapper = ({ children }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    netbookApi.fetchNotes.mockResolvedValue(paged(serverNotes));
  });

  it("returns server notes untouched when nothing is pending", async () => {
    const { result } = renderHook(() => useNotes(1, true), { wrapper });

    await waitFor(() => expect(result.current.notes).toHaveLength(2));
    expect(result.current.notes[0]).toEqual(serverNotes[0]);
    expect(result.current.pendingCount).toBe(0);
  });

  it("prepends pending creates on page 1, newest first, marked pending", async () => {
    queueNoteCreate(queryClient, { title: "Older local", content: "" });
    queueNoteCreate(queryClient, { title: "Newer local", content: "" });

    const { result } = renderHook(() => useNotes(1, true), { wrapper });

    await waitFor(() => expect(result.current.notes).toHaveLength(4));
    expect(result.current.notes[0]).toMatchObject({ title: "Newer local", pending: true });
    expect(result.current.notes[1]).toMatchObject({ title: "Older local", pending: true });
    expect(result.current.notes[0].id).toMatch(/^pending-/);
    expect(result.current.pendingCount).toBe(2);
  });

  it("does not prepend pending creates on later pages", async () => {
    queueNoteCreate(queryClient, { title: "Local", content: "" });

    const { result } = renderHook(() => useNotes(2, true), { wrapper });

    await waitFor(() => expect(result.current.notes).toHaveLength(2));
    expect(result.current.notes.every((note) => !note.pending)).toBe(true);
    expect(result.current.pendingCount).toBe(1);
  });

  it("overlays pending updates onto the matching server note", async () => {
    queueNoteUpdate(queryClient, serverNotes[0], { title: "Edited", content: "CX" });

    const { result } = renderHook(() => useNotes(1, true), { wrapper });

    await waitFor(() => expect(result.current.notes).toHaveLength(2));
    expect(result.current.notes[0]).toMatchObject({
      id: "n1",
      title: "Edited",
      content: "CX",
      pending: true,
      // The server's updatedAt survives the overlay so later edits keep a valid base.
      updatedAt: "u1",
    });
    expect(result.current.notes[1]).toEqual(serverNotes[1]);
  });

  it("filters out notes with a pending delete", async () => {
    queueNoteDelete(queryClient, serverNotes[0]);

    const { result } = renderHook(() => useNotes(1, true), { wrapper });

    await waitFor(() => expect(result.current.notes).toHaveLength(1));
    expect(result.current.notes[0].id).toBe("n2");
  });

  it("shows pending creates instead of a loading state while the fetch is unresolved", () => {
    netbookApi.fetchNotes.mockReturnValue(new Promise(() => {}));
    queueNoteCreate(queryClient, { title: "Local", content: "" });

    const { result } = renderHook(() => useNotes(1, true), { wrapper });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.notes).toHaveLength(1);
  });

  it("reports loading when there is nothing at all to render", () => {
    netbookApi.fetchNotes.mockReturnValue(new Promise(() => {}));

    const { result } = renderHook(() => useNotes(1, true), { wrapper });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.notes).toEqual([]);
  });
});
