# Offline notes in Netbook

Netbook saves note writes locally when the network is unavailable and syncs them to netbook-service when connectivity returns.
This document is the design record for that feature; the implementation lives in `apps/Netbook/src/offline/`.

## Scope

In scope: while the Notes page is open, creates, edits, and deletes succeed locally when the network is down, are visibly marked as unsynced, survive a tab close via cache persistence, and flush automatically when connectivity returns.

Out of scope: cold-starting the app with no connection (requires service-worker/PWA work), cross-tab queue merging, and client-generated note ids.

## Design summary

The sync model is state-based, not operation-replay: offline writes coalesce into per-note pending entries, and the flush sends each note's final state once.
This is what makes create-then-edit-then-edit collapse into a single POST and removes any temp-id rewriting problem.

### The `["pendingNotes"]` cache entry

Pending operations live in the existing TanStack Query cache under the key `["pendingNotes"]`, as an ordered array (oldest first) of entries:

```js
{
  localId: "pending-<uuid>",   // identity in the UI; never sent to the server
  op: "create" | "update" | "delete",
  serverId: null,              // set when op targets a note that exists on the server
  title, content,
  baseUpdatedAt: null,         // opaque server updatedAt the edit was based on; update/delete only
  createdAt, updatedAt,        // local ISO timestamps, for display
}
```

The entry is never fetched; it is written with `setQueryData` and read by an `enabled: false` query.
`setQueryDefaults(["pendingNotes"], { gcTime: Infinity })` in `main.jsx` keeps it from being garbage-collected while unobserved.

Coalescing rules (one write path, in `pendingNotesStore.js`):

- Editing a pending create overwrites its `title`/`content` in place.
- Deleting a pending create removes the entry; nothing ever reaches the server.
- Editing an existing server note upserts an `op: "update"` entry keyed by `serverId`; repeated edits overwrite it but keep the original `baseUpdatedAt` (edits are based on what the user last saw from the server, not on intermediate local states).
- Deleting an existing server note replaces any update entry for that `serverId` with a single `op: "delete"` entry.

The queue therefore never holds two operations for the same note.

### Read path

`useNotes(page)` merges the server page with the pending queue at render time:

- Pending creates are prepended on page 1, newest first, shaped like server notes with `id: localId` and `pending: true`.
- Pending updates overlay `title`/`content` onto the matching server note.
- Pending deletes filter the matching server note out.

Because pending state lives under its own key, refetches and `invalidateQueries({ queryKey: ["notes"] })` can never clobber it.
Page 1 may temporarily exceed the server page size and the page count may be off until sync; that is accepted rather than faked.

### Write path

Every write follows a two-gate rule, because `navigator.onLine` is a hint rather than a guarantee:

1. If the target note already has a pending entry, the write is pure coalescing against the store — the network is never consulted.
   If online, a flush is kicked immediately afterward.
2. Otherwise, if `onlineManager.isOnline()` is false, write a pending entry and finish instantly.
3. Otherwise fire the normal mutation with `networkMode: "always"` (the default `"online"` mode would silently pause the mutation if the browser flips offline mid-flight, wedging the form on "Saving...").
   On a network-level failure (`!error.response`) the attempted write converts into a pending entry, exactly as if gate 2 had caught it; real server error responses surface as errors, as today.

The user-visible contract: a save never fails because of connectivity.

### Flush engine

`flushPendingNotes(queryClient)` drains the queue sequentially, oldest first, with a module-level in-flight guard.
Per entry: create → `POST /notes`; update → `PUT /notes/:id` with `updatedAt: baseUpdatedAt` when present; delete → `DELETE /notes/:id` with `{ updatedAt: baseUpdatedAt }` as the body when present.

Failure policy:

- Network error or 5xx: stop; remaining entries stay queued for the next trigger.
- 401/403: stop; an expired session must never discard queued notes.
- 409 on update (conflict): the server's version wins the row, and the local content is converted in place into a new pending create titled "&lt;title&gt; (conflicted copy)", which the same flush run then posts.
  Neither side is ever silently lost, and no interactive merge UI is needed.
- 409 on delete: drop the delete and keep the note; deleting a note whose latest version you have not seen should not win.
- Any other 4xx: drop the entry and log it; retrying can never succeed.

If any entry was resolved, the flush ends with `invalidateQueries({ queryKey: ["notes"] })` so server truth replaces the overlays atomically.

Triggers, wired once in `main.jsx`: the offline→online transition (`onlineManager.subscribe`) and app startup after cache restore (catches "closed the tab while offline").
Coalescing writes against already-pending notes also kick a flush when online.

### Persistence

`main.jsx` uses `PersistQueryClientProvider` with a localStorage persister (`@tanstack/query-sync-storage-persister`):

- `shouldDehydrateQuery` restricted to `["pendingNotes"]` and `["notes", *]` — deliberately not `["currentUser"]`, whose `staleTime: Infinity` would otherwise let a reload skip `iamApi.verify()` and silently change session semantics.
- `maxAge: Infinity` — the default 24 h would discard unsynced notes on restore; a `buster` string exists for schema changes.

A reload while offline lands on the splash (verify fails), but pending notes are safe in localStorage and flush once connectivity returns, since flushing needs only cookies, not the rendered page.

### Form drafts

In-progress form content is a separate, simpler mechanism from the pending queue (`noteDrafts.js`).
Every keystroke in a `NoteForm` with a `draftKey` writes `{title, content, savedAt}` to the `netbook-note-drafts` localStorage entry, keyed `"new"` for the create form or by note id for edits.
This protects against refresh, tab close, and notably the automatic `vite:preloadError` reload after a redeploy; going offline mid-typing was never a loss case, since form state lives in memory.

Drafts deliberately live outside the query cache: they never merge with server data, and keystroke-frequency cache writes would make the persister re-serialize every cached page.

Lifecycle:

- The create form reopens automatically on load when a `"new"` draft survives; edit drafts restore when that note's editor is reopened.
- A draft is cleared when its note is saved or queued, and on an explicit Cancel.
- An implicit exit (collapsing the card by clicking its title) keeps the draft, so an accidental collapse doesn't lose work.
- Drafts older than 30 days are pruned at startup, which also collects drafts orphaned when a pending note's id changes after sync.

### Server contract (implemented in netbook-service)

- `Note` has an `updatedAt` column, set on every write and returned in responses; `PUT` returns 200 with the updated note.
- `PUT /notes/{id}` and `DELETE /notes/{id}` accept an optional `updatedAt` precondition.
  Absent means unconditional write, exactly as before; present means the write is rejected with 409 — carrying the current server row — when the stored `UpdatedAt` is strictly newer.
  A null stored `UpdatedAt` (legacy row) is never "newer".
- The client treats `updatedAt` as an opaque string: stored exactly as received, echoed byte-for-byte, never round-tripped through `Date`.
  The server's strictly-newer comparison absorbs the Postgres-vs-.NET timestamp precision mismatch.
- Creates send no precondition and the server mints ids.

### Accepted limits

- Offline creates are at-least-once: a queue restored into a second tab, or a POST whose response is lost mid-flight, can produce a duplicate note.
  Duplicates are visible and user-repairable, which was judged preferable to dedup machinery (client ids plus upsert) that resolves silently.
  Revisit if Netbook becomes genuinely multi-device with routine offline use.
- Both tabs persist to one localStorage key, last writer wins; a tab closed while offline after another tab overwrote the key can lose its queue.
  Same accepted-rarity reasoning as above.
- Conflict protection is one-sided by design: conditional (flushed) writes cannot clobber anyone, but ordinary online writes remain unconditional last-writer-wins, as before this feature.
- Offline reads cover only pages already visited; offline cold-start needs the PWA work.
