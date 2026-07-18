import { useState } from "react";
import { Button } from "@headlessui/react";
import { onlineManager, useMutation, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "@shared/core/hooks/useAuth";
import { createNote, deleteNote, updateNote } from "@shared/core/services/netbookApi";

import MiddenCard from "@shared/ui/components/MiddenCard";
import MiddenModal from "@shared/ui/components/MiddenModal";
import NoteForm from "../components/NoteForm";
import NoteList from "../components/NoteList";
import { useNotes } from "../hooks/useNotes";
import { flushPendingNotes } from "../offline/flushPendingNotes";
import { clearDraft, getDraft, NEW_NOTE_DRAFT_KEY } from "../offline/noteDrafts";
import { queueNoteCreate, queueNoteDelete, queueNoteUpdate } from "../offline/pendingNotesStore";
import NetbookSplash from "./NetbookSplash";

// Axios network-level failures carry no response; anything the server actually
// answered does.
const isNetworkError = (error) => !error.response;

const Notes = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  // A surviving draft means the user was mid-write when the page unloaded
  // (refresh, redeploy reload) — reopen the form with it.
  const [showNewForm, setShowNewForm] = useState(() => !!getDraft(NEW_NOTE_DRAFT_KEY));
  const [noteToDelete, setNoteToDelete] = useState(null);

  const enabled = !!user && user.username !== "guest";
  const { notes, totalPages, isLoading, pendingCount } = useNotes(page, enabled);

  const kickFlush = () => {
    if (onlineManager.isOnline()) {
      flushPendingNotes(queryClient);
    }
  };

  // The note was saved (or queued) — its draft is spent.
  const closeNewForm = () => {
    clearDraft(NEW_NOTE_DRAFT_KEY);
    setShowNewForm(false);
    setPage(1);
  };

  const queueCreate = (noteData) => {
    queueNoteCreate(queryClient, noteData);
    closeNewForm();
    kickFlush();
  };

  const createNoteMutation = useMutation({
    mutationFn: (noteData) => createNote(noteData),
    networkMode: "always",
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes"] });
      closeNewForm();
    },
    onError: (error, noteData) => {
      if (isNetworkError(error)) {
        queueCreate(noteData);
        return;
      }
      console.error("Failed to create note", error);
    },
  });

  const handleCreateNote = (noteData) => {
    if (!onlineManager.isOnline()) {
      queueCreate(noteData);
      return;
    }
    createNoteMutation.mutate(noteData);
  };

  const updateNoteMutation = useMutation({
    mutationFn: ({ id, noteData }) => updateNote(id, noteData),
    networkMode: "always",
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes"] });
    },
  });

  const queueUpdate = (note, noteData) => {
    queueNoteUpdate(queryClient, note, noteData);
    kickFlush();
  };

  const onUpdateNote = async (id, noteData) => {
    const note = notes.find((n) => n.id === id);
    if (!note) {
      return;
    }
    // A note with a pending entry is always edited through the queue, so the
    // queue stays the single path from local state to the server.
    if (note.pending || !onlineManager.isOnline()) {
      queueUpdate(note, noteData);
      clearDraft(note.id);
      return;
    }
    try {
      await updateNoteMutation.mutateAsync({ id, noteData });
      clearDraft(note.id);
    } catch (error) {
      if (isNetworkError(error)) {
        queueUpdate(note, noteData);
        clearDraft(note.id);
        return;
      }
      throw error;
    }
  };

  const stepBackIfPageEmptied = () => {
    // If we just removed the last note on a non-first page, step back so the
    // user doesn't land on an empty page.
    if (notes.length === 1 && page > 1) {
      setPage((p) => Math.max(1, p - 1));
    }
  };

  const queueDelete = (note) => {
    queueNoteDelete(queryClient, note);
    stepBackIfPageEmptied();
    setNoteToDelete(null);
    kickFlush();
  };

  const deleteNoteMutation = useMutation({
    mutationFn: (note) => deleteNote(note.id),
    networkMode: "always",
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes"] });
      stepBackIfPageEmptied();
      setNoteToDelete(null);
    },
    onError: (error, note) => {
      if (isNetworkError(error)) {
        queueDelete(note);
        return;
      }
      console.error("Failed to delete note", error);
    },
  });

  const confirmDelete = () => {
    const note = notes.find((n) => n.id === noteToDelete);
    if (!note) {
      setNoteToDelete(null);
      return;
    }
    if (note.pending || !onlineManager.isOnline()) {
      queueDelete(note);
      return;
    }
    deleteNoteMutation.mutate(note);
  };

  const handleDeleteNote = (e, noteId) => {
    e.preventDefault();
    e.stopPropagation();
    setNoteToDelete(noteId);
  };

  // Guests and logged-out visitors get the splash, not the notebook.
  if (!user || user.username === "guest") {
    return <NetbookSplash />;
  }

  return (
    <MiddenCard>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="font-gothic text-4xl font-bold text-white">My Notes</h2>
        {!showNewForm && (
          <Button
            onClick={() => setShowNewForm(true)}
            className="bg-accent hover:bg-accent/80 px-3 py-1 text-sm font-bold text-white transition-colors"
          >
            + New note
          </Button>
        )}
      </div>

      {pendingCount > 0 && (
        <p className="text-accent mb-4 font-mono text-sm">
          {pendingCount} {pendingCount === 1 ? "change" : "changes"} saved offline — will sync when
          you&apos;re back online.
        </p>
      )}

      {showNewForm && (
        <div className="border-grey mb-6 border-2 border-dashed p-4">
          <NoteForm
            draftKey={NEW_NOTE_DRAFT_KEY}
            onSubmit={handleCreateNote}
            onCancel={() => {
              clearDraft(NEW_NOTE_DRAFT_KEY);
              setShowNewForm(false);
            }}
            loading={createNoteMutation.isPending}
            submitLabel="Create Note"
          />
        </div>
      )}

      <NoteList
        fetchingNotes={isLoading}
        notes={notes}
        handleDeleteNote={handleDeleteNote}
        onUpdateNote={onUpdateNote}
        updating={updateNoteMutation.isPending}
        emptyMessage="You haven't written any notes yet."
      />

      {totalPages > 1 && (
        <div className="text-lightGrey mt-6 flex items-center justify-center gap-4 font-mono text-sm">
          <Button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="hover:text-accent px-2 font-bold transition-colors disabled:opacity-30"
          >
            ‹ Prev
          </Button>
          <span>
            Page {page} of {totalPages}
          </span>
          <Button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="hover:text-accent px-2 font-bold transition-colors disabled:opacity-30"
          >
            Next ›
          </Button>
        </div>
      )}

      <MiddenModal
        isOpen={!!noteToDelete}
        onClose={() => setNoteToDelete(null)}
        title="Delete Note"
      >
        <p className="text-lightestGrey mb-6 font-mono">
          Are you sure you want to delete this note? This action cannot be undone.
        </p>
        <div className="flex justify-end gap-2">
          <Button
            onClick={() => setNoteToDelete(null)}
            className="text-lightGrey px-4 py-2 font-bold hover:text-white"
          >
            Cancel
          </Button>
          <Button
            onClick={confirmDelete}
            disabled={deleteNoteMutation.isPending}
            className="bg-red-500 px-4 py-2 font-bold text-white hover:bg-red-600 disabled:opacity-50"
          >
            {deleteNoteMutation.isPending ? "Deleting..." : "Delete"}
          </Button>
        </div>
      </MiddenModal>
    </MiddenCard>
  );
};

export default Notes;
