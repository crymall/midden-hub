import { useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { Button } from "@headlessui/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "@shared/core/hooks/useAuth";
import {
  createList,
  fetchFollowers,
  fetchRelationshipCounts,
  fetchUser,
  fetchUserLists,
  fetchUserRecipes,
  followUser,
  unfollowUser,
} from "@shared/core/services/canteenApi";

import MiddenCard from "@shared/ui/components/MiddenCard";
import CreateListModal from "../components/CreateListModal";
import ListList from "../components/ListList";
import PaginationControls from "../components/PaginationControls";
import RecipeList from "../components/RecipeList";

const UserProfile = () => {
  const { id } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  const activeTab = searchParams.get("tab") === "lists" ? "lists" : "recipes";
  const [isCreateListOpen, setIsCreateListOpen] = useState(false);

  const [recipePage, setRecipePage] = useState(1);
  const [recipeLimit, setRecipeLimit] = useState(20);
  const [listPage, setListPage] = useState(1);
  const [listLimit, setListLimit] = useState(20);

  const {
    data: viewedUser,
    isLoading: viewedUserLoading,
    isError: fetchFailed,
  } = useQuery({
    queryKey: ["user", id],
    queryFn: () => fetchUser(id),
    enabled: !!id,
    retry: false,
  });

  const { data: relationshipCounts } = useQuery({
    queryKey: ["relationshipCounts", id],
    queryFn: () => fetchRelationshipCounts(id),
    enabled: !!id,
  });

  const { data: isFollowingCheck = [] } = useQuery({
    queryKey: ["isFollowing", id, currentUser?.canteenId],
    queryFn: () => fetchFollowers(id, 1, 0, currentUser?.canteenId),
    enabled: !!id && !!currentUser && String(currentUser.canteenId) !== String(id),
  });
  const isFollowing = isFollowingCheck.length > 0;

  const { data: userProfileRecipes = [], isLoading: recipesLoading } = useQuery({
    queryKey: ["userProfileRecipes", id, { page: recipePage, limit: recipeLimit }],
    queryFn: () => fetchUserRecipes(id, recipeLimit, (recipePage - 1) * recipeLimit),
    enabled: !!id && activeTab === "recipes",
  });

  const { data: userLists = [], isLoading: listsLoading } = useQuery({
    queryKey: ["userLists", id, { page: listPage, limit: listLimit }],
    queryFn: () => fetchUserLists(id, listLimit, (listPage - 1) * listLimit),
    enabled: !!id && activeTab === "lists",
  });

  const createListMutation = useMutation({
    mutationFn: (name) => createList(name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userLists", id] });
      queryClient.invalidateQueries({ queryKey: ["comboboxLists"] });
      setIsCreateListOpen(false);
      setSearchParams({ tab: "lists" });
    },
    onError: (error) => {
      console.error("Failed to create list", error);
    },
  });

  const handleCreateList = (name) => {
    createListMutation.mutate(name);
  };

  const isOwnProfile =
    currentUser && viewedUser && String(currentUser.canteenId) === String(viewedUser.id);

  const toggleFollowMutation = useMutation({
    mutationFn: async () => {
      if (isFollowing) {
        await unfollowUser(id);
      } else {
        await followUser(id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["isFollowing", id, currentUser?.canteenId],
      });
      queryClient.invalidateQueries({ queryKey: ["relationshipCounts", id] });
      queryClient.invalidateQueries({
        queryKey: ["following", currentUser?.canteenId],
      });
    },
  });

  const handleFollowToggle = () => {
    toggleFollowMutation.mutate();
  };

  const switchTab = (tab) => {
    const newParams = tab === "recipes" ? {} : { tab };
    setSearchParams(newParams);
  };

  if (viewedUserLoading) {
    return (
      <MiddenCard>
        <div className="flex justify-center p-8">
          <p className="text-lightestGrey animate-pulse font-mono text-xl">Loading profile...</p>
        </div>
      </MiddenCard>
    );
  }

  if (fetchFailed || !viewedUser) {
    return (
      <MiddenCard>
        <div className="flex justify-center p-8">
          <p className="text-lightGrey font-mono text-lg">User not found.</p>
        </div>
      </MiddenCard>
    );
  }

  return (
    <MiddenCard>
      <div className="mb-4 flex items-center justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="font-gothic text-4xl font-bold text-white truncate">
            {viewedUser.username}
          </h1>
          <div className="text-lightGrey mt-1 hidden gap-4 font-mono text-sm md:flex">
            {isOwnProfile ? (
              <>
                <Link
                  to={`/user/${viewedUser.id}/network?tab=followers`}
                  className="hover:text-white transition-colors"
                >
                  <strong className="text-white">{relationshipCounts?.followers || 0}</strong>{" "}
                  Followers
                </Link>
                <Link
                  to={`/user/${viewedUser.id}/network?tab=following`}
                  className="hover:text-white transition-colors"
                >
                  <strong className="text-white">{relationshipCounts?.following || 0}</strong>{" "}
                  Following
                </Link>
              </>
            ) : (
              <>
                <span>
                  <strong className="text-white">{relationshipCounts?.followers || 0}</strong>{" "}
                  Followers
                </span>
                <span>
                  <strong className="text-white">{relationshipCounts?.following || 0}</strong>{" "}
                  Following
                </span>
              </>
            )}
          </div>
        </div>
        <div className="flex shrink-0 gap-2">
          {!isOwnProfile && currentUser && (
            <Button
              onClick={handleFollowToggle}
              disabled={toggleFollowMutation.isPending}
              className={`px-3 py-1 text-sm font-bold transition-colors ${
                isFollowing
                  ? "border-grey text-lightGrey hover:border-lightestGrey hover:text-white border bg-transparent"
                  : "bg-accent hover:bg-accent/80 text-dark disabled:opacity-50"
              }`}
            >
              {isFollowing ? "Unfollow" : "Follow"}
            </Button>
          )}
          {isOwnProfile && (
            <>
              <Button
                onClick={() => setIsCreateListOpen(true)}
                className="bg-accent hover:bg-accent/80 px-3 py-1 text-sm font-bold text-dark transition-colors"
              >
                + List
              </Button>
              <Link to="/recipes/new">
                <Button className="bg-accent hover:bg-accent/80 px-3 py-1 text-sm font-bold text-dark transition-colors">
                  + Recipe
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>

      <div className="border-grey mb-6 flex border-b">
        <button
          onClick={() => switchTab("recipes")}
          className={`px-6 py-2 font-mono text-lg font-bold transition-colors ${activeTab === "recipes" ? "border-accent text-accent border-b-2" : "text-lightGrey hover:text-white"}`}
        >
          Recipes
        </button>
        <button
          onClick={() => switchTab("lists")}
          className={`px-6 py-2 font-mono text-lg font-bold transition-colors ${activeTab === "lists" ? "border-accent text-accent border-b-2" : "text-lightGrey hover:text-white"}`}
        >
          Lists
        </button>
      </div>

      {activeTab === "recipes" ? (
        <div>
          <RecipeList recipes={userProfileRecipes} loading={recipesLoading} />
          <PaginationControls
            page={recipePage}
            limit={recipeLimit}
            onPageChange={setRecipePage}
            onLimitChange={(e) => {
              setRecipeLimit(Number(e.target.value));
              setRecipePage(1);
            }}
            loading={recipesLoading}
            isNextDisabled={userProfileRecipes.length < recipeLimit}
          />
        </div>
      ) : (
        <div>
          <ListList
            fetchingLists={listsLoading}
            userLists={userLists}
            emptyMessage="No lists found for this user."
          />
          {isOwnProfile && (
            <div className="mt-6 flex justify-end">
              <Link
                to="/my-lists"
                className="text-accent font-mono font-bold transition-colors hover:text-white"
              >
                Manage My Lists →
              </Link>
            </div>
          )}
          <PaginationControls
            page={listPage}
            limit={listLimit}
            onPageChange={setListPage}
            onLimitChange={(e) => {
              setListLimit(Number(e.target.value));
              setListPage(1);
            }}
            loading={listsLoading}
            isNextDisabled={userLists.length < listLimit}
          />
        </div>
      )}

      <CreateListModal
        isOpen={isCreateListOpen}
        onClose={() => setIsCreateListOpen(false)}
        onCreate={handleCreateList}
        loading={createListMutation.isPending}
      />
    </MiddenCard>
  );
};

export default UserProfile;
