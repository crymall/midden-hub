import { useEffect, useState, useEffectEvent, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@headlessui/react";
import useData from "@shared/core/context/data/useData";
import useAuth from "@shared/core/context/auth/useAuth";
import MiddenCard from "@shared/ui/components/MiddenCard";
import MiddenModal from "@shared/ui/components/MiddenModal";
import ListList from "../components/ListList";
import PaginationControls from "../components/PaginationControls";
import CreateListModal from "../components/CreateListModal";

const MyLists = () => {
  const { user } = useAuth();
  const { userLists, getUserLists, canteenApi } = useData();
  const navigate = useNavigate();
  const location = useLocation();
  const hasHistory = location.key !== "default";
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [creatingList, setCreatingList] = useState(false);
  const [fetchingLists, setFetchingLists] = useState(userLists.length === 0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [listToDelete, setListToDelete] = useState(null);

  const setFetchingListsTrueEvent = useEffectEvent(() => {
    setFetchingLists(true);
  });

  const setFetchingListsFalseEvent = useEffectEvent(() => {
    setFetchingLists(false);
  });

  const initialFetchRef = useRef(false);

  useEffect(() => {
    if (user) {
      if (!initialFetchRef.current && userLists.length > 0 && page === 1) {
        setFetchingListsFalseEvent();
      } else {
        setFetchingListsTrueEvent();
        getUserLists(user.canteenId, limit, (page - 1) * limit).finally(() =>
          setFetchingListsFalseEvent(),
        );
      }
      initialFetchRef.current = true;
    }
  }, [user, getUserLists, page, limit, userLists.length]);

  const handleCreateList = async (name) => {
    setCreatingList(true);
    try {
      await canteenApi.createList(name);
      await getUserLists(user.canteenId, limit, (page - 1) * limit);
      setIsCreateModalOpen(false);
    } catch (error) {
      console.error("Failed to create list", error);
    } finally {
      setCreatingList(false);
    }
  };

  const handleDeleteList = (e, listId) => {
    e.preventDefault();
    e.stopPropagation();
    setListToDelete(listId);
  };

  const confirmDeleteList = async () => {
    try {
      await canteenApi.deleteList(listToDelete);
      await getUserLists(user.canteenId, limit, (page - 1) * limit);
      setListToDelete(null);
    } catch (error) {
      console.error("Failed to delete list", error);
    }
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
              className="text-white hover:text-accent text-3xl leading-none transition-colors focus:outline-none"
              aria-label="Go back"
            >
              ←
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
        loading={creatingList}
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
            className="bg-red-500 px-4 py-2 font-bold text-white hover:bg-red-600"
          >
            Delete
          </Button>
        </div>
      </MiddenModal>
    </MiddenCard>
  );
};

export default MyLists;
