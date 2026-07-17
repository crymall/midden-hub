import { useState } from "react";
import { Button } from "@headlessui/react";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "@shared/core/hooks/useAuth";
import { createNote, deleteNote, fetchNotes, updateNote } from "@shared/core/services/netbookApi";

import MiddenCard from "@shared/ui/components/MiddenCard";
import MiddenModal from "@shared/ui/components/MiddenModal";
import NoteForm from "../components/NoteForm";
import NoteList from "../components/NoteList";
import NetbookSplash from "./NetbookSplash";

const Notes = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [showNewForm, setShowNewForm] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ["notes", page],
    queryFn: () => fetchNotes(page),
    placeholderData: keepPreviousData,
    enabled: !!user && user.username !== "guest",
  });

  const notes = data?.items ?? [];
  const totalPages = data?.totalPages ?? 1;

  const createNoteMutation = useMutation({
    mutationFn: (noteData) => createNote(noteData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes"] });
      setShowNewForm(false);
      setPage(1);
    },
    onError: (error) => {
      console.error("Failed to create note", error);
    },
  });

  const updateNoteMutation = useMutation({
    mutationFn: ({ id, noteData }) => updateNote(id, noteData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes"] });
    },
  });

  const onUpdateNote = (id, noteData) => updateNoteMutation.mutateAsync({ id, noteData });

  const deleteNoteMutation = useMutation({
    mutationFn: (id) => deleteNote(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes"] });
      // If we just removed the last note on a non-first page, step back so the
      // user doesn't land on an empty page.
      if (notes.length === 1 && page > 1) {
        setPage((p) => Math.max(1, p - 1));
      }
      setNoteToDelete(null);
    },
    onError: (error) => {
      console.error("Failed to delete note", error);
    },
  });

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

      {showNewForm && (
        <div className="border-grey mb-6 border-2 border-dashed p-4">
          <NoteForm
            onSubmit={(noteData) => createNoteMutation.mutate(noteData)}
            onCancel={() => setShowNewForm(false)}
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
            onClick={() => deleteNoteMutation.mutate(noteToDelete)}
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
