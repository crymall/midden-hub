import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { fetchNotes } from "@shared/core/services/netbookApi";

import { PENDING_NOTES_QUERY_KEY } from "../offline/pendingNotesStore";

// Merges the server page with the pending offline queue for display: pending
// creates are prepended on page 1, pending updates overlay their content onto
// the matching server note, and pending deletes filter the note out.
export const useNotes = (page, enabled) => {
  const { data, isLoading } = useQuery({
    queryKey: ["notes", page],
    queryFn: () => fetchNotes(page),
    placeholderData: keepPreviousData,
    enabled,
  });

  const { data: pendingEntries = [] } = useQuery({
    queryKey: PENDING_NOTES_QUERY_KEY,
    queryFn: () => [],
    enabled: false,
    staleTime: Infinity,
    gcTime: Infinity,
  });

  const serverNotes = data?.items ?? [];
  const byServerId = new Map(
    pendingEntries
      .filter((entry) => entry.serverId != null)
      .map((entry) => [entry.serverId, entry]),
  );

  const overlaid = serverNotes
    .filter((note) => byServerId.get(note.id)?.op !== "delete")
    .map((note) => {
      const entry = byServerId.get(note.id);
      return entry ? { ...note, title: entry.title, content: entry.content, pending: true } : note;
    });

  const pendingCreates =
    page === 1
      ? pendingEntries
          .filter((entry) => entry.op === "create")
          .map((entry) => ({
            id: entry.localId,
            localId: entry.localId,
            title: entry.title,
            content: entry.content,
            createdAt: entry.createdAt,
            pending: true,
          }))
          .reverse()
      : [];

  const notes = [...pendingCreates, ...overlaid];

  return {
    notes,
    totalPages: data?.totalPages ?? 1,
    // Pending notes are worth showing even while the server page is loading
    // (or unreachable), so only report loading when there is nothing to render.
    isLoading: isLoading && notes.length === 0,
    pendingCount: pendingEntries.length,
  };
};
