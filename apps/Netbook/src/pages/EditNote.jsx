import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { fetchNote, updateNote } from "@shared/core/services/netbookApi";

import Loading from "@shared/ui/components/Loading";
import MiddenCard from "@shared/ui/components/MiddenCard";
import NoteForm from "../components/NoteForm";

const EditNote = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const {
    data: note,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["note", id],
    queryFn: () => fetchNote(id),
  });

  const updateNoteMutation = useMutation({
    mutationFn: (noteData) => updateNote(id, noteData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes"] });
      queryClient.invalidateQueries({ queryKey: ["note", id] });
      navigate(`/notes/${id}`);
    },
    onError: (error) => {
      console.error("Failed to update note", error);
    },
  });

  if (isLoading) {
    return <Loading message="Loading note..." />;
  }

  if (isError || !note) {
    return (
      <MiddenCard>
        <p className="text-lightGrey font-mono">Note not found.</p>
      </MiddenCard>
    );
  }

  return (
    <MiddenCard>
      <h2 className="font-gothic mb-6 text-4xl font-bold text-white">Edit Note</h2>
      <NoteForm
        initialNote={note}
        onSubmit={(noteData) => updateNoteMutation.mutate(noteData)}
        onCancel={() => navigate(-1)}
        loading={updateNoteMutation.isPending}
        submitLabel="Save Note"
      />
    </MiddenCard>
  );
};

export default EditNote;
