import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@headlessui/react";
import { useAuth } from "@shared/core/hooks/useAuth";
import MiddenCard from "@shared/ui/components/MiddenCard";
import MiddenModal from "@shared/ui/components/MiddenModal";
import ListList from "../components/ListList";
import PaginationControls from "../components/PaginationControls";
import CreateListModal from "../components/CreateListModal";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createList, fetchUserLists, deleteList } from "@shared/core/services/canteenApi";

const MyLists = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const hasHistory = location.key !== "default" && !location.state?.hideBack;
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [listToDelete, setListToDelete] = useState(null);
  const offset = limit ? (page - 1) * limit : 0; 

  const { data: userLists = [], isLoading: fetchingLists } = useQuery({
    queryKey: ["userLists", user?.canteenId, { limit: limit, offset: offset }],
    queryFn: () => fetchUserLists(user.canteenId, limit, offset, "", "created_at", "DESC"),
    enabled: !!user
  });

  const createListMutation = useMutation({
    mutationFn: (name) => createList(name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userLists", user?.canteenId] });
      queryClient.invalidateQueries({ queryKey: ["comboboxLists"] });
      setIsCreateModalOpen(false);
    },
    onError: (error) => {
      console.error("Failed to create list", error);
    }
  });

  const handleCreateList = (name) => {
    createListMutation.mutate(name);
  };

  const handleDeleteList = (e, listId) => {
    e.preventDefault();
    e.stopPropagation();
    setListToDelete(listId);
  };

  const deleteListMutation = useMutation({
    mutationFn: (id) => deleteList(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userLists", user?.canteenId] });
      queryClient.invalidateQueries({ queryKey: ["comboboxLists"] });
      setListToDelete(null);
    },
    onError: (error) => {
      console.error("Failed to delete list", error);
    }
  });

  const confirmDeleteList = () => {
    deleteListMutation.mutate(listToDelete);
  };

  const handlePageChange = (newPage) => {
    setPage(newPage);
  };

  const handleLimitChange = (e) => {
    setLimit(Number(e.target.value));
    setPage(1);
  };

  return (
    <MiddenCard>
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          {hasHistory && (
            <button
              onClick={() => navigate(-1)}
              className="text-white hover:text-accent text-3xl font-icons icon leading-none transition-colors focus:outline-none"
              aria-label="Go back"
            >
              D
            </button>
          )}
          <h2 className="font-gothic text-4xl font-bold text-white">My Lists</h2>
        </div>
        <Button
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-accent hover:bg-accent/80 px-3 py-1 text-sm font-bold text-white transition-colors"
        >
          + List
        </Button>
      </div>

      <ListList
        fetchingLists={fetchingLists}
        userLists={userLists}
        handleDeleteList={handleDeleteList}
        emptyMessage="You haven't created any lists yet."
      />

      <PaginationControls
        page={page}
        limit={limit}
        onPageChange={handlePageChange}
        onLimitChange={handleLimitChange}
        loading={fetchingLists}
        isNextDisabled={userLists.length < limit}
      />

      <CreateListModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={handleCreateList}
        loading={createListMutation.isPending}
      />

      <MiddenModal
        isOpen={!!listToDelete}
        onClose={() => setListToDelete(null)}
        title="Delete List"
      >
        <p className="text-lightestGrey mb-6 font-mono">
          Are you sure you want to delete this list? This action cannot be
          undone.
        </p>
        <div className="flex justify-end gap-2">
          <Button
            onClick={() => setListToDelete(null)}
            className="text-lightGrey px-4 py-2 font-bold hover:text-white"
          >
            Cancel
          </Button>
          <Button
            onClick={confirmDeleteList}
            disabled={deleteListMutation.isPending}
            className="bg-red-500 px-4 py-2 font-bold text-white hover:bg-red-600 disabled:opacity-50"
          >
            {deleteListMutation.isPending ? "Deleting..." : "Delete"}
          </Button>
        </div>
      </MiddenModal>
    </MiddenCard>
  );
};

export default MyLists;
