const DRAFTS_STORAGE_KEY = "netbook-note-drafts";

export const NEW_NOTE_DRAFT_KEY = "new";

const MAX_DRAFT_AGE_MS = 30 * 24 * 60 * 60 * 1000;

const readAll = () => {
  try {
    return JSON.parse(window.localStorage.getItem(DRAFTS_STORAGE_KEY)) ?? {};
  } catch {
    return {};
  }
};

const writeAll = (drafts) =>
  window.localStorage.setItem(DRAFTS_STORAGE_KEY, JSON.stringify(drafts));

export const getDraft = (draftKey) => readAll()[draftKey] ?? null;

export const getDraftKeys = () => new Set(Object.keys(readAll()));

export const saveDraft = (draftKey, { title, content }) => {
  writeAll({ ...readAll(), [draftKey]: { title, content, savedAt: Date.now() } });
};

export const clearDraft = (draftKey) => {
  const drafts = readAll();
  if (draftKey in drafts) {
    delete drafts[draftKey];
    writeAll(drafts);
  }
};

export const pruneStaleDrafts = (now = Date.now()) => {
  const drafts = readAll();
  const fresh = Object.fromEntries(
    Object.entries(drafts).filter(([, draft]) => now - (draft.savedAt ?? 0) < MAX_DRAFT_AGE_MS),
  );
  if (Object.keys(fresh).length !== Object.keys(drafts).length) {
    writeAll(fresh);
  }
};
