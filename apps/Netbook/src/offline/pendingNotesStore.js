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
  const existingNoteUpdate = entries.find((entry) => entry.serverId === note.id);

  // If the note exists in pending notes. Presence of localId means it was created in the client
  // this pending session, existingNoteUpdate means we're performing an update on an update from
  // a note that existed in the server already (i.e. a serverId is present).
  if (note.localId || existingNoteUpdate) {
    setPendingNotes(
      queryClient,
      entries.map((entry) =>
        entry.localId === note.localId || entry === existingNoteUpdate
          ? { ...entry, title, content, updatedAt: now }
          : entry,
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
      // Echoed back byte-for-byte as the write precondition; never round-trip through Date.
      baseUpdatedAt: note.updatedAt ?? null,
      createdAt: note.createdAt,
      updatedAt: now,
    },
  ]);
};

export const queueNoteDelete = (queryClient, note) => {
  const entries = getPendingNotes(queryClient);

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
