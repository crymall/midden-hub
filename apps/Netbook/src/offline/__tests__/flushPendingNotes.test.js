import { QueryClient } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";

import * as netbookApi from "@shared/core/services/netbookApi";

import { flushPendingNotes } from "../flushPendingNotes";
import {
  getPendingNotes,
  queueNoteCreate,
  queueNoteDelete,
  queueNoteUpdate,
} from "../pendingNotesStore";

vi.mock("@shared/core/services/netbookApi");

const networkError = () => new Error("Network Error");
const httpError = (status) =>
  Object.assign(new Error(`Request failed with status code ${status}`), {
    response: { status },
  });

describe("flushPendingNotes", () => {
  let queryClient;
  const serverNote = {
    id: "n1",
    title: "Server title",
    content: "Server content",
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "u1",
  };

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient();
    netbookApi.createNote.mockResolvedValue({ id: "s1" });
    netbookApi.updateNote.mockResolvedValue({});
    netbookApi.deleteNote.mockResolvedValue({});
  });

  it("drains the queue oldest-first with payloads and preconditions", async () => {
    queueNoteCreate(queryClient, { title: "New", content: "Body" });
    queueNoteUpdate(queryClient, serverNote, { title: "Edited", content: "C2" });
    queueNoteDelete(queryClient, { ...serverNote, id: "n2", updatedAt: "u2" });
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    await flushPendingNotes(queryClient);

    expect(netbookApi.createNote).toHaveBeenCalledWith({ title: "New", content: "Body" });
    expect(netbookApi.updateNote).toHaveBeenCalledWith("n1", {
      title: "Edited",
      content: "C2",
      updatedAt: "u1",
    });
    expect(netbookApi.deleteNote).toHaveBeenCalledWith("n2", "u2");
    expect(getPendingNotes(queryClient)).toEqual([]);
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["notes"] });
  });

  it("omits the precondition when the base updatedAt is unknown", async () => {
    queueNoteUpdate(queryClient, { ...serverNote, updatedAt: null }, { title: "E", content: "C" });
    queueNoteDelete(queryClient, { ...serverNote, id: "n2", updatedAt: null });

    await flushPendingNotes(queryClient);

    expect(netbookApi.updateNote).toHaveBeenCalledWith("n1", { title: "E", content: "C" });
    expect(netbookApi.deleteNote).toHaveBeenCalledWith("n2", undefined);
  });

  it("stops on a network failure and keeps the whole queue", async () => {
    netbookApi.createNote.mockRejectedValue(networkError());
    queueNoteCreate(queryClient, { title: "First", content: "" });
    queueNoteUpdate(queryClient, serverNote, { title: "Second", content: "" });
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    await flushPendingNotes(queryClient);

    expect(getPendingNotes(queryClient)).toHaveLength(2);
    expect(netbookApi.updateNote).not.toHaveBeenCalled();
    expect(invalidateSpy).not.toHaveBeenCalled();
  });

  it("stops on an expired session without dropping entries", async () => {
    netbookApi.createNote.mockRejectedValue(httpError(401));
    queueNoteCreate(queryClient, { title: "First", content: "" });

    await flushPendingNotes(queryClient);

    expect(getPendingNotes(queryClient)).toHaveLength(1);
  });

  it("converts a 409 update conflict into a conflicted copy and posts it", async () => {
    netbookApi.updateNote.mockRejectedValue(httpError(409));
    queueNoteUpdate(queryClient, serverNote, { title: "Mine", content: "Local edit" });

    await flushPendingNotes(queryClient);

    expect(netbookApi.createNote).toHaveBeenCalledWith({
      title: "Mine (conflicted copy)",
      content: "Local edit",
    });
    expect(getPendingNotes(queryClient)).toEqual([]);
  });

  it("drops a 409 delete conflict so the newer server note survives", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    netbookApi.deleteNote.mockRejectedValue(httpError(409));
    queueNoteDelete(queryClient, serverNote);
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    await flushPendingNotes(queryClient);

    expect(getPendingNotes(queryClient)).toEqual([]);
    expect(netbookApi.createNote).not.toHaveBeenCalled();
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["notes"] });
  });

  it("drops entries the server permanently rejects", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    netbookApi.updateNote.mockRejectedValue(httpError(404));
    queueNoteUpdate(queryClient, serverNote, { title: "E", content: "C" });

    await flushPendingNotes(queryClient);

    expect(getPendingNotes(queryClient)).toEqual([]);
  });

  it("does not run concurrently", async () => {
    let resolveCreate;
    netbookApi.createNote.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveCreate = resolve;
        }),
    );
    queueNoteCreate(queryClient, { title: "Only once", content: "" });

    const first = flushPendingNotes(queryClient);
    const second = flushPendingNotes(queryClient);
    resolveCreate({});
    await Promise.all([first, second]);

    expect(netbookApi.createNote).toHaveBeenCalledTimes(1);
  });
});
