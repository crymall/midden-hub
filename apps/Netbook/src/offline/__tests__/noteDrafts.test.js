import { beforeEach, describe, expect, it } from "vitest";

import { clearDraft, getDraft, pruneStaleDrafts, saveDraft } from "../noteDrafts";

describe("noteDrafts", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("returns null when no draft exists", () => {
    expect(getDraft("new")).toBeNull();
  });

  it("saves and reads a draft by key", () => {
    saveDraft("new", { title: "T", content: "C" });
    expect(getDraft("new")).toMatchObject({ title: "T", content: "C" });
    expect(getDraft("new").savedAt).toEqual(expect.any(Number));
  });

  it("keeps drafts for different keys independent", () => {
    saveDraft("new", { title: "New", content: "" });
    saveDraft("n1", { title: "Edit", content: "" });

    clearDraft("new");

    expect(getDraft("new")).toBeNull();
    expect(getDraft("n1")).toMatchObject({ title: "Edit" });
  });

  it("survives corrupted storage", () => {
    window.localStorage.setItem("netbook-note-drafts", "not json");
    expect(getDraft("new")).toBeNull();
    saveDraft("new", { title: "T", content: "" });
    expect(getDraft("new")).toMatchObject({ title: "T" });
  });

  it("prunes drafts older than the max age and keeps fresh ones", () => {
    const now = Date.now();
    window.localStorage.setItem(
      "netbook-note-drafts",
      JSON.stringify({
        old: { title: "Old", content: "", savedAt: now - 31 * 24 * 60 * 60 * 1000 },
        fresh: { title: "Fresh", content: "", savedAt: now },
      }),
    );

    pruneStaleDrafts(now);

    expect(getDraft("old")).toBeNull();
    expect(getDraft("fresh")).not.toBeNull();
  });
});
