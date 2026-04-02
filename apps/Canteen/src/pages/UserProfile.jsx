import { useEffect, useState, useRef } from "react";
import { useParams, Link, useSearchParams } from "react-router-dom";
import { Button } from "@headlessui/react";
import useData from "@shared/core/context/data/useData";
import useAuth from "@shared/core/context/auth/useAuth";
import MiddenCard from "@shared/ui/components/MiddenCard";
import RecipeList from "../components/RecipeList";
import ListList from "../components/ListList";
import PaginationControls from "../components/PaginationControls";
import CreateListModal from "../components/CreateListModal";

const UserProfile = () => {
  const { id } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user: currentUser } = useAuth();
  const {
    canteenApi,
    getUserProfileRecipes,
    userProfileRecipes,
    getUserLists,
    userLists,
    recipesLoading,
    relationshipCounts,
    getRelationshipCounts,
    followUser,
    unfollowUser,
    viewedUser,
    viewedUserLoading,
    getViewedUser,
  } = useData();
  const activeTab = searchParams.get("tab") === "lists" ? "lists" : "recipes";
  const [isCreateListOpen, setIsCreateListOpen] = useState(false);
  const [creatingList, setCreatingList] = useState(false);
  const [fetchFailed, setFetchFailed] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);

  const [recipePage, setRecipePage] = useState(1);
  const [recipeLimit, setRecipeLimit] = useState(20);
  const [listPage, setListPage] = useState(1);
  const [listLimit, setListLimit] = useState(20);
  const [listsLoading, setListsLoading] = useState(false);

  const fetchedRecipesRef = useRef(null);
  const fetchedListsRef = useRef(null);

  useEffect(() => {
    fetchedRecipesRef.current = null;
    fetchedListsRef.current = null;
    setRecipePage(1);
    setListPage(1);
  }, [id]);

  useEffect(() => {
    if (id) {
      if (String(viewedUser?.id) !== String(id)) {
        setFetchFailed(false);
        getViewedUser(id).then((res) => {
          if (!res) setFetchFailed(true);
        });
      }
      getRelationshipCounts(id);

      if (currentUser && String(currentUser.canteenId) !== String(id)) {
        canteenApi.fetchFollowers(id, 1, 0, currentUser.canteenId).then((res) => {
          setIsFollowing(res?.length > 0);
        }).catch(console.error);
      }
    }
  }, [id, viewedUser?.id, getViewedUser, getRelationshipCounts, currentUser, canteenApi]);

  useEffect(() => {
    if (id && activeTab === "recipes") {
      if (fetchedRecipesRef.current === id && recipePage === 1) {
        return;
      }
      getUserProfileRecipes(id, recipeLimit, (recipePage - 1) * recipeLimit);
      fetchedRecipesRef.current = id;
    }
  }, [id, recipePage, recipeLimit, getUserProfileRecipes, activeTab]);

  useEffect(() => {
    if (id && activeTab === "lists") {
      if (fetchedListsRef.current === id && listPage === 1) {
        return;
      }
      setListsLoading(true);
      getUserLists(id, listLimit, (listPage - 1) * listLimit).finally(() => {
        setListsLoading(false);
        fetchedListsRef.current = id;
      });
    }
  }, [id, listPage, listLimit, getUserLists, activeTab]);

  const handleCreateList = async (name) => {
    setCreatingList(true);
    try {
      await canteenApi.createList(name);
      await getUserLists(id, listLimit, (listPage - 1) * listLimit);
      setIsCreateListOpen(false);
      setSearchParams({ tab: "lists" });
    } catch (error) {
      console.error("Failed to create list", error);
    } finally {
      setCreatingList(false);
    }
  };

  const isOwnProfile =
    currentUser &&
    viewedUser &&
    String(currentUser.canteenId) === String(viewedUser.id);

  const handleFollowToggle = async () => {
    if (isFollowing) {
      await unfollowUser(id);
      setIsFollowing(false);
    } else {
      await followUser(id);
      setIsFollowing(true);
    }
    getRelationshipCounts(id);
  };

  const switchTab = (tab) => {
    const newParams = tab === "recipes" ? {} : { tab };
    setSearchParams(newParams);
  };

  if (viewedUserLoading || (String(viewedUser?.id) !== String(id) && !fetchFailed)) {
    return (
      <MiddenCard>
        <div className="flex justify-center p-8">
          <p className="text-lightestGrey animate-pulse font-mono text-xl">
            Loading profile...
          </p>
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
              className={`px-3 py-1 text-sm font-bold transition-colors ${
                isFollowing
                  ? "border-grey text-lightGrey hover:border-lightestGrey hover:text-white border bg-transparent"
                  : "bg-accent hover:bg-accent/80 text-white"
              }`}
            >
              {isFollowing ? "Unfollow" : "Follow"}
            </Button>
          )}
          {isOwnProfile && (
            <>
              <Button
                onClick={() => setIsCreateListOpen(true)}
                className="bg-accent hover:bg-accent/80 px-3 py-1 text-sm font-bold text-white transition-colors"
              >
                + List
              </Button>
              <Link to="/recipes/new">
                <Button className="bg-accent hover:bg-accent/80 px-3 py-1 text-sm font-bold text-white transition-colors">
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
          className={`px-6 py-2 font-mono text-lg font-bold transition-colors ${
            activeTab === "recipes"
              ? "border-accent text-accent border-b-2"
              : "text-lightGrey hover:text-white"
          }`}
        >
          Recipes
        </button>
        <button
          onClick={() => switchTab("lists")}
          className={`px-6 py-2 font-mono text-lg font-bold transition-colors ${
            activeTab === "lists"
              ? "border-accent text-accent border-b-2"
              : "text-lightGrey hover:text-white"
          }`}
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
        loading={creatingList}
      />
    </MiddenCard>
  );
};

export default UserProfile;
