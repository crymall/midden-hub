// In-progress form content, persisted per keystroke so a refresh, tab close,
// or the vite:preloadError redeploy reload doesn't lose what's being written.
// Drafts are pure UI state keyed by note identity ("new" for the create form,
// the note id for edits) and deliberately live outside the query cache — they
// never merge with server data, and keystroke-frequency writes would otherwise
// make the persister re-serialize every cached page.
const DRAFTS_STORAGE_KEY = "netbook-note-drafts";

// Note ids are uuids (server) or "pending-<uuid>" (queue), so "new" can't collide.
export const NEW_NOTE_DRAFT_KEY = "new";

// Drafts for notes that no longer exist (e.g. a pending note whose id changed
// after sync) would otherwise linger forever.
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
