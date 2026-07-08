import { useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Button } from "@headlessui/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { deleteNote, fetchNote } from "@shared/core/services/netbookApi";

import Loading from "@shared/ui/components/Loading";
import MiddenCard from "@shared/ui/components/MiddenCard";
import MiddenModal from "@shared/ui/components/MiddenModal";

const NoteDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const hasHistory = location.key !== "default" && !location.state?.loginRedirect;
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const {
    data: note,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["note", id],
    queryFn: () => fetchNote(id),
  });

  const deleteNoteMutation = useMutation({
    mutationFn: () => deleteNote(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes"] });
      queryClient.removeQueries({ queryKey: ["note", id] });
      navigate("/");
    },
    onError: (error) => {
      console.error("Failed to delete note", error);
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
      <div className="mb-6 flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          {hasHistory && (
            <button
              onClick={() => navigate(-1)}
              className="hover:text-accent font-icons icon text-3xl leading-none text-white transition-colors focus:outline-none"
              aria-label="Go back"
            >
              D
            </button>
          )}
          <h2 className="font-gothic text-4xl font-bold text-white">{note.title || "Untitled"}</h2>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => navigate(`/notes/${id}/edit`)}
            className="bg-accent hover:bg-accent/80 px-3 py-1 text-sm font-bold text-white transition-colors"
          >
            Edit
          </Button>
          <Button
            onClick={() => setIsDeleteModalOpen(true)}
            className="bg-red-500 px-3 py-1 text-sm font-bold text-white transition-colors hover:bg-red-600"
          >
            Delete
          </Button>
        </div>
      </div>

      <p className="text-grey mb-6 text-sm">
        Created{" "}
        {new Date(note.createdAt).toLocaleDateString(undefined, {
          year: "numeric",
          month: "long",
          day: "numeric",
        })}
      </p>

      <p className="text-lightestGrey whitespace-pre-wrap">{note.content}</p>

      <MiddenModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete Note"
      >
        <p className="text-lightestGrey mb-6 font-mono">
          Are you sure you want to delete this note? This action cannot be undone.
        </p>
        <div className="flex justify-end gap-2">
          <Button
            onClick={() => setIsDeleteModalOpen(false)}
            className="text-lightGrey px-4 py-2 font-bold hover:text-white"
          >
            Cancel
          </Button>
          <Button
            onClick={() => deleteNoteMutation.mutate()}
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

export default NoteDetail;
