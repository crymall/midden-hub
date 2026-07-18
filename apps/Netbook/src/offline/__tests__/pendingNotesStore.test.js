import { QueryClient } from "@tanstack/react-query";
import { beforeEach, describe, expect, it } from "vitest";

import {
  getPendingNotes,
  queueNoteCreate,
  queueNoteDelete,
  queueNoteUpdate,
  removePendingNote,
  replacePendingNote,
} from "../pendingNotesStore";

describe("pendingNotesStore", () => {
  let queryClient;
  const serverNote = {
    id: "n1",
    title: "Server title",
    content: "Server content",
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-07-01T00:00:00.1234567Z",
  };

  beforeEach(() => {
    queryClient = new QueryClient();
  });

  it("queues a create with a generated local id", () => {
    queueNoteCreate(queryClient, { title: "New", content: "Body" });

    const entries = getPendingNotes(queryClient);
    expect(entries).toHaveLength(1);
    expect(entries[0]).toMatchObject({
      op: "create",
      serverId: null,
      title: "New",
      content: "Body",
      baseUpdatedAt: null,
    });
    expect(entries[0].localId).toMatch(/^pending-/);
  });

  it("folds an edit of a pending create into the create entry", () => {
    queueNoteCreate(queryClient, { title: "New", content: "Body" });
    const [created] = getPendingNotes(queryClient);

    queueNoteUpdate(queryClient, { localId: created.localId }, { title: "Fixed", content: "B2" });

    const entries = getPendingNotes(queryClient);
    expect(entries).toHaveLength(1);
    expect(entries[0]).toMatchObject({ op: "create", title: "Fixed", content: "B2" });
    expect(entries[0].localId).toBe(created.localId);
  });

  it("removes the pending create when a local-only note is deleted", () => {
    queueNoteCreate(queryClient, { title: "New", content: "Body" });
    const [created] = getPendingNotes(queryClient);

    queueNoteDelete(queryClient, { localId: created.localId });

    expect(getPendingNotes(queryClient)).toEqual([]);
  });

  it("queues an update for a server note with its updatedAt as the base", () => {
    queueNoteUpdate(queryClient, serverNote, { title: "Edited", content: "C2" });

    const entries = getPendingNotes(queryClient);
    expect(entries).toHaveLength(1);
    expect(entries[0]).toMatchObject({
      op: "update",
      serverId: "n1",
      title: "Edited",
      content: "C2",
      baseUpdatedAt: serverNote.updatedAt,
    });
  });

  it("coalesces repeated edits and keeps the original baseUpdatedAt", () => {
    queueNoteUpdate(queryClient, serverNote, { title: "First edit", content: "C2" });
    queueNoteUpdate(
      queryClient,
      { ...serverNote, updatedAt: "2026-07-02T00:00:00Z" },
      { title: "Second edit", content: "C3" },
    );

    const entries = getPendingNotes(queryClient);
    expect(entries).toHaveLength(1);
    expect(entries[0]).toMatchObject({
      op: "update",
      title: "Second edit",
      content: "C3",
      baseUpdatedAt: serverNote.updatedAt,
    });
  });

  it("replaces a pending update with a single delete that keeps the base", () => {
    queueNoteUpdate(queryClient, serverNote, { title: "Edited", content: "C2" });
    queueNoteDelete(queryClient, { ...serverNote, updatedAt: "2026-07-02T00:00:00Z" });

    const entries = getPendingNotes(queryClient);
    expect(entries).toHaveLength(1);
    expect(entries[0]).toMatchObject({
      op: "delete",
      serverId: "n1",
      baseUpdatedAt: serverNote.updatedAt,
    });
  });

  it("queues a delete for an untouched server note", () => {
    queueNoteDelete(queryClient, serverNote);

    const entries = getPendingNotes(queryClient);
    expect(entries).toHaveLength(1);
    expect(entries[0]).toMatchObject({
      op: "delete",
      serverId: "n1",
      baseUpdatedAt: serverNote.updatedAt,
    });
  });

  it("removes and replaces entries by local id", () => {
    queueNoteCreate(queryClient, { title: "A", content: "" });
    queueNoteCreate(queryClient, { title: "B", content: "" });
    const [first, second] = getPendingNotes(queryClient);

    replacePendingNote(queryClient, first.localId, { ...first, title: "A2" });
    removePendingNote(queryClient, second.localId);

    const entries = getPendingNotes(queryClient);
    expect(entries).toHaveLength(1);
    expect(entries[0].title).toBe("A2");
  });
});
