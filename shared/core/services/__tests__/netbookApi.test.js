import { beforeEach, describe, expect, it, vi } from "vitest";

import * as api from "../netbookApi";

const { mockGet, mockPost, mockPut, mockDelete } = vi.hoisted(() => ({
  mockGet: vi.fn(),
  mockPost: vi.fn(),
  mockPut: vi.fn(),
  mockDelete: vi.fn(),
}));

vi.mock("axios", () => ({
  default: {
    create: vi.fn(() => ({
      get: mockGet,
      post: mockPost,
      put: mockPut,
      delete: mockDelete,
    })),
  },
}));

describe("netbookApi", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGet.mockResolvedValue({ data: {} });
    mockPost.mockResolvedValue({ data: {} });
    mockPut.mockResolvedValue({ data: {} });
    mockDelete.mockResolvedValue({ data: {} });
  });

  it("fetchNotes calls get on /notes", async () => {
    await api.fetchNotes();
    expect(mockGet).toHaveBeenCalledWith("/notes");
  });

  it("fetchNote calls get with the note id", async () => {
    await api.fetchNote("n1");
    expect(mockGet).toHaveBeenCalledWith("/notes/n1");
  });

  it("createNote posts the note data", async () => {
    const noteData = { title: "Title", content: "Content" };
    await api.createNote(noteData);
    expect(mockPost).toHaveBeenCalledWith("/notes", noteData);
  });

  it("updateNote puts the note data with the id included", async () => {
    await api.updateNote("n1", { title: "Title", content: "Content" });
    expect(mockPut).toHaveBeenCalledWith("/notes/n1", {
      id: "n1",
      title: "Title",
      content: "Content",
    });
  });

  it("deleteNote calls delete with the note id", async () => {
    await api.deleteNote("n1");
    expect(mockDelete).toHaveBeenCalledWith("/notes/n1");
  });

  it("returns response data", async () => {
    mockGet.mockResolvedValue({ data: [{ id: "n1" }] });
    const result = await api.fetchNotes();
    expect(result).toEqual([{ id: "n1" }]);
  });
});
