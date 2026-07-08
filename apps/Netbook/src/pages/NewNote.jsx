import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { createNote } from "@shared/core/services/netbookApi";

import MiddenCard from "@shared/ui/components/MiddenCard";
import NoteForm from "../components/NoteForm";

const NewNote = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const createNoteMutation = useMutation({
    mutationFn: (noteData) => createNote(noteData),
    onSuccess: (note) => {
      queryClient.invalidateQueries({ queryKey: ["notes"] });
      navigate(`/notes/${note.id}`);
    },
    onError: (error) => {
      console.error("Failed to create note", error);
    },
  });

  return (
    <MiddenCard>
      <h2 className="font-gothic mb-6 text-4xl font-bold text-white">New Note</h2>
      <NoteForm
        onSubmit={(noteData) => createNoteMutation.mutate(noteData)}
        onCancel={() => navigate(-1)}
        loading={createNoteMutation.isPending}
        submitLabel="Create Note"
      />
    </MiddenCard>
  );
};

export default NewNote;
