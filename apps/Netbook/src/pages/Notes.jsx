import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@headlessui/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { deleteNote, fetchNotes } from "@shared/core/services/netbookApi";

import MiddenCard from "@shared/ui/components/MiddenCard";
import MiddenModal from "@shared/ui/components/MiddenModal";
import NoteList from "../components/NoteList";

const Notes = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [noteToDelete, setNoteToDelete] = useState(null);

  const { data: notes = [], isLoading: fetchingNotes } = useQuery({
    queryKey: ["notes"],
    queryFn: fetchNotes,
  });

  const sortedNotes = [...notes].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const handleDeleteNote = (e, noteId) => {
    e.preventDefault();
    e.stopPropagation();
    setNoteToDelete(noteId);
  };

  const deleteNoteMutation = useMutation({
    mutationFn: (id) => deleteNote(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes"] });
      setNoteToDelete(null);
    },
    onError: (error) => {
      console.error("Failed to delete note", error);
    },
  });

  const confirmDeleteNote = () => {
    deleteNoteMutation.mutate(noteToDelete);
  };

  return (
    <MiddenCard>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="font-gothic text-4xl font-bold text-white">My Notes</h2>
        <Button
          onClick={() => navigate("/notes/new")}
          className="bg-accent hover:bg-accent/80 px-3 py-1 text-sm font-bold text-white transition-colors"
        >
          + Note
        </Button>
      </div>

      <NoteList
        fetchingNotes={fetchingNotes}
        notes={sortedNotes}
        handleDeleteNote={handleDeleteNote}
        emptyMessage="You haven't written any notes yet."
      />

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
            onClick={confirmDeleteNote}
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
