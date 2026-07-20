import { createNote, deleteNote, updateNote } from "@shared/core/services/netbookApi";

import { getPendingNotes, removePendingNote, replacePendingNote } from "./pendingNotesStore";

let flushing = false;

const sendEntry = (entry) => {
  if (entry.op === "create") {
    return createNote({ title: entry.title, content: entry.content });
  }
  if (entry.op === "update") {
    const payload = { title: entry.title, content: entry.content };
    if (entry.baseUpdatedAt) {
      payload.updatedAt = entry.baseUpdatedAt;
    }
    return updateNote(entry.serverId, payload);
  }
  return deleteNote(entry.serverId, entry.baseUpdatedAt ?? undefined);
};

export const flushPendingNotes = async (queryClient) => {
  if (flushing) {
    return;
  }
  flushing = true;
  let resolvedAny = false;
  try {
    for (;;) {
      const [entry] = getPendingNotes(queryClient);
      if (!entry) {
        break;
      }
      try {
        await sendEntry(entry);
        removePendingNote(queryClient, entry.localId);
        resolvedAny = true;
      } catch (error) {
        const status = error.response?.status;
        if (!status || status >= 500 || status === 401 || status === 403) {
          break;
        }
        if (status === 409 && entry.op === "update") {
          // The server's version wins; the local edit survives as a visible
          // conflicted copy rather than being dropped silently.
          replacePendingNote(queryClient, entry.localId, {
            ...entry,
            op: "create",
            serverId: null,
            baseUpdatedAt: null,
            title: `${entry.title} (conflicted copy)`,
          });
          resolvedAny = true;
          continue;
        }
        console.error("Dropping unsyncable pending note change", entry, error);
        removePendingNote(queryClient, entry.localId);
        resolvedAny = true;
      }
    }
  } finally {
    flushing = false;
    if (resolvedAny) {
      await queryClient.invalidateQueries({ queryKey: ["notes"] });
    }
  }
};
