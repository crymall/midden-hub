export const PENDING_NOTES_QUERY_KEY = ["pendingNotes"];

const newLocalId = () => `pending-${crypto.randomUUID()}`;

export const getPendingNotes = (queryClient) =>
  queryClient.getQueryData(PENDING_NOTES_QUERY_KEY) ?? [];

const setPendingNotes = (queryClient, entries) =>
  queryClient.setQueryData(PENDING_NOTES_QUERY_KEY, entries);

export const queueNoteCreate = (queryClient, { title, content }) => {
  const now = new Date().toISOString();
  setPendingNotes(queryClient, [
    ...getPendingNotes(queryClient),
    {
      localId: newLocalId(),
      op: "create",
      serverId: null,
      title,
      content,
      baseUpdatedAt: null,
      createdAt: now,
      updatedAt: now,
    },
  ]);
};

export const queueNoteUpdate = (queryClient, note, { title, content }) => {
  const entries = getPendingNotes(queryClient);
  const now = new Date().toISOString();

  // A note that only exists locally: fold the edit into its pending create.
  if (note.localId) {
    setPendingNotes(
      queryClient,
      entries.map((entry) =>
        entry.localId === note.localId ? { ...entry, title, content, updatedAt: now } : entry,
      ),
    );
    return;
  }

  const existing = entries.find((entry) => entry.serverId === note.id);
  if (existing) {
    // Repeated offline edits overwrite the queued content but keep the original
    // baseUpdatedAt — the edit is based on what the user last saw from the server,
    // not on their own intermediate local states.
    setPendingNotes(
      queryClient,
      entries.map((entry) =>
        entry === existing ? { ...entry, title, content, updatedAt: now } : entry,
      ),
    );
    return;
  }

  setPendingNotes(queryClient, [
    ...entries,
    {
      localId: newLocalId(),
      op: "update",
      serverId: note.id,
      title,
      content,
      // Opaque server value, echoed byte-for-byte as the write precondition;
      // never round-trip it through Date.
      baseUpdatedAt: note.updatedAt ?? null,
      createdAt: note.createdAt,
      updatedAt: now,
    },
  ]);
};

export const queueNoteDelete = (queryClient, note) => {
  const entries = getPendingNotes(queryClient);

  // A note that only exists locally: drop its pending create, nothing to sync.
  if (note.localId) {
    setPendingNotes(
      queryClient,
      entries.filter((entry) => entry.localId !== note.localId),
    );
    return;
  }

  const existing = entries.find((entry) => entry.serverId === note.id);
  setPendingNotes(queryClient, [
    ...entries.filter((entry) => entry !== existing),
    {
      localId: existing?.localId ?? newLocalId(),
      op: "delete",
      serverId: note.id,
      title: note.title,
      content: note.content,
      baseUpdatedAt: existing?.baseUpdatedAt ?? note.updatedAt ?? null,
      createdAt: note.createdAt,
      updatedAt: new Date().toISOString(),
    },
  ]);
};

export const removePendingNote = (queryClient, localId) =>
  setPendingNotes(
    queryClient,
    getPendingNotes(queryClient).filter((entry) => entry.localId !== localId),
  );

export const replacePendingNote = (queryClient, localId, replacement) =>
  setPendingNotes(
    queryClient,
    getPendingNotes(queryClient).map((entry) => (entry.localId === localId ? replacement : entry)),
  );
