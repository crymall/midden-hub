import { useEffect, useEffectEvent, useState } from "react";
import { useParams, Link, useNavigate, useLocation } from "react-router-dom";
import {
  Button,
  Popover,
  PopoverButton,
  PopoverPanel,
} from "@headlessui/react";
import useData from "@shared/core/context/data/useData";
import useAuth from "@shared/core/context/auth/useAuth";
import MiddenCard from "@shared/ui/components/MiddenCard";
import Can from "@shared/core/gateways/Can";
import ListAddPopover from "../components/ListAddPopover";
import ShareRecipePopover from "../components/ShareRecipePopover";
import MiddenModal from "@shared/ui/components/MiddenModal";
import { PERMISSIONS } from "@shared/core/utils/constants";

const RecipeDetail = () => {
  const { id } = useParams();
  const {
    currentRecipe,
    recipesLoading,
    getRecipe,
    toggleRecipeLike,
    getUserLists,
    deleteRecipe,
  } = useData();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const hasHistory = location.key !== "default";
  const [fetchFailed, setFetchFailed] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const setFetchFailedEvent = useEffectEvent(() => {
    setFetchFailed(true);
  });

  const setFetchNotFailedEvent = useEffectEvent(() => {
    setFetchFailed(false);
  });

  useEffect(() => {
    if (id) {
      if (String(currentRecipe?.id) !== String(id)) {
        setFetchNotFailedEvent(false);
        getRecipe(id).then((res) => {
          if (!res) setFetchFailedEvent(true);
        });
      }
    }
  }, [id, currentRecipe?.id, getRecipe]);

  useEffect(() => {
    if (user) {
      getUserLists(user.id);
    }
  }, [user, getUserLists]);

  if (
    recipesLoading ||
    (String(currentRecipe?.id) !== String(id) && !fetchFailed)
  ) {
    return (
      <MiddenCard>
        <div className="flex justify-center p-8">
          <p className="text-lightestGrey animate-pulse font-mono text-xl">
            Loading recipe...
          </p>
        </div>
      </MiddenCard>
    );
  }

  if (fetchFailed || !currentRecipe) {
    return (
      <MiddenCard>
        <div className="flex justify-center p-8">
          <p className="text-lightGrey font-mono text-lg">Recipe not found.</p>
        </div>
      </MiddenCard>
    );
  }

  const isLiked = currentRecipe.likes?.some(
    (like) => like.user_id === user?.id,
  );

  const isOwner =
    user &&
    currentRecipe.author &&
    String(user.id) === String(currentRecipe.author.id);

  const handleLike = () => {
    toggleRecipeLike(currentRecipe.id, isLiked);
  };

  const formatTime = (minutes) => {
    if (minutes === null || minutes === undefined || minutes === "")
      return "0m";
    const num = Number(minutes);
    if (isNaN(num)) return "0m";
    if (num < 60) return `${num}m`;
    const hrs = Math.floor(num / 60);
    const mins = num % 60;
    if (mins === 0) return `${hrs}h`;
    return `${hrs}h${mins.toString().padStart(2, "0")}m`;
  };

  const confirmDelete = async () => {
    try {
      await deleteRecipe(currentRecipe.id);
      setIsDeleteModalOpen(false);
      navigate("/recipes");
    } catch (err) {
      console.error("Failed to delete recipe", err);
    }
  };

  return (
    <MiddenCard>
      <div className="flex flex-col gap-6">
        <div className="border-grey pb-2">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div className="flex-1">
              <div className="mb-2 flex items-start gap-4">
                {hasHistory && (
                  <button
                    onClick={() => navigate(-1)}
                    className="hover:text-accent mt-0.5 text-2xl leading-none text-white transition-colors focus:outline-none"
                    aria-label="Go back"
                  >
                    ←
                  </button>
                )}
                <div className="flex flex-col gap-0">
                  <h1 className="font-mono text-3xl leading-none font-bold text-white">
                    {currentRecipe.title}
                  </h1>
                  {currentRecipe.author && (
                    <p className="text-lightGrey font-mono text-sm">
                      By{" "}
                      <Link
                        to={`/user/${currentRecipe.author.id}`}
                        className="text-accent hover:underline"
                      >
                        {currentRecipe.author.username}
                      </Link>
                    </p>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap gap-2 md:mb-4">
                {currentRecipe.tags?.map((tag) => (
                  <span
                    key={tag.id}
                    className="bg-accent/30 text-lightestGrey border-accent/50 border px-2 py-0.5 font-mono text-xs font-bold"
                  >
                    {tag.name}
                  </span>
                ))}
              </div>
            </div>
            <Can perform={PERMISSIONS.writeData}>
              <div className="flex flex-wrap gap-2 max-sm:relative md:justify-end">
                <Button
                  onClick={handleLike}
                  className={`flex h-8 items-center justify-center gap-2.5 border px-3 text-sm font-bold transition-colors ${
                    isLiked
                      ? "bg-accent border-accent text-white"
                      : "text-lightestGrey border-grey hover:border-lightestGrey bg-transparent"
                  }`}
                >
                  <span>{isLiked ? "♥" : "♡"}</span>
                  <span className="hidden sm:block">
                    {isLiked ? "Liked" : "Like"}
                  </span>
                </Button>
                <ListAddPopover
                  recipeId={currentRecipe.id}
                  className="max-sm:static sm:relative"
                  buttonClassName="bg-grey hover:bg-lightGrey text-dark flex h-8 items-center justify-center gap-1.5 px-3 text-sm font-bold transition-colors"
                  panelClassName="max-sm:w-[calc(100vw-2rem)] max-sm:max-w-[calc(100vw-2rem)] max-sm:left-0 max-sm:right-0 max-sm:mx-auto sm:right-0 top-full mt-2"
                  label={
                    <>
                      <span>+</span>
                      <span className="hidden sm:block">Add to</span> List
                    </>
                  }
                />
                <ShareRecipePopover
                  recipe={currentRecipe}
                  className="max-sm:static sm:relative"
                  buttonClassName="bg-grey hover:bg-lightGrey text-dark flex h-8 items-center justify-center px-3 text-sm font-bold transition-colors"
                  panelClassName="max-sm:w-[calc(100vw-2rem)] max-sm:max-w-[calc(100vw-2rem)] max-sm:left-0 max-sm:right-0 max-sm:mx-auto sm:right-0 top-full mt-2"
                  label="Share"
                />
                {isOwner && (
                  <Popover className="max-sm:static sm:relative">
                    <PopoverButton
                      className="bg-grey hover:bg-lightGrey text-dark flex h-8 w-8 items-center justify-center px-0 text-lg font-bold transition-colors"
                      aria-label="Options"
                    >
                      ⋮
                    </PopoverButton>
                    <PopoverPanel className="bg-dark border-grey absolute top-full z-10 mt-2 flex w-[calc(100vw-2rem)] max-w-[calc(100vw-2rem)] flex-col gap-2 border p-2 shadow-lg max-sm:right-0 max-sm:left-0 max-sm:mx-auto sm:right-0 sm:w-32">
                      <Link
                        to={`/recipes/${currentRecipe.id}/edit`}
                        className="w-full"
                        state={{ fromDetail: true }}
                      >
                        <Button className="bg-grey hover:bg-lightGrey text-dark flex h-8 w-full items-center justify-center px-3 text-sm font-bold transition-colors">
                          Edit
                        </Button>
                      </Link>
                      <Button
                        onClick={() => setIsDeleteModalOpen(true)}
                        className="flex h-8 w-full items-center justify-center bg-red-900/80 px-3 text-sm font-bold text-white transition-colors hover:bg-red-800"
                      >
                        Delete
                      </Button>
                    </PopoverPanel>
                  </Popover>
                )}
              </div>
            </Can>
          </div>
          <p className="text-lightestGrey mt-4 font-mono text-lg italic md:mt-0">
            {currentRecipe.description}
          </p>
        </div>

        <div className="text-lightestGrey grid grid-cols-2 gap-4 rounded-lg bg-white/5 p-4 text-center font-mono md:grid-cols-4">
          <div>
            <span className="text-grey block text-xs tracking-wider uppercase">
              Prep Time
            </span>
            <span className="text-xl font-bold">
              {formatTime(currentRecipe.prep_time_minutes)}
            </span>
          </div>
          <div>
            <span className="text-grey block text-xs tracking-wider uppercase">
              Cook Time
            </span>
            <span className="text-xl font-bold">
              {formatTime(currentRecipe.cook_time_minutes)}
            </span>
          </div>
          <div>
            <span className="text-grey block text-xs tracking-wider uppercase">
              Total Time
            </span>
            <span className="text-xl font-bold">
              {formatTime(currentRecipe.total_time_minutes)}
            </span>
          </div>
          <div>
            <span className="text-grey block text-xs tracking-wider uppercase">
              Servings
            </span>
            <span className="text-xl font-bold">{currentRecipe.servings}</span>
          </div>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          <div className="md:col-span-1">
            <h3 className="font-gothic border-grey mb-4 border-b pb-2 text-3xl text-white">
              Ingredients
            </h3>
            <ul className="text-lightestGrey space-y-2 font-mono">
              {currentRecipe.ingredients?.map((ing, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-accent">•</span>
                  <span>
                    {ing.quantity} {ing.unit} <strong>{ing.name}</strong>
                    {ing.notes && (
                      <span className="text-grey text-sm italic">
                        {" "}
                        ({ing.notes})
                      </span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="md:col-span-2">
            <h3 className="font-gothic border-grey mb-4 border-b pb-2 text-3xl text-white">
              Instructions
            </h3>
            <div className="text-lightestGrey font-mono leading-relaxed whitespace-pre-wrap">
              {currentRecipe.instructions}
            </div>
          </div>
        </div>
      </div>

      <MiddenModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete Recipe"
      >
        <p className="text-lightestGrey mb-6 font-mono">
          Are you sure you want to delete this recipe? This action cannot be
          undone.
        </p>
        <div className="flex justify-end gap-2">
          <Button
            onClick={() => setIsDeleteModalOpen(false)}
            className="text-lightGrey px-4 py-2 font-bold hover:text-white"
          >
            Cancel
          </Button>
          <Button
            onClick={confirmDelete}
            className="bg-red-500 px-4 py-2 font-bold text-white hover:bg-red-600"
          >
            Delete
          </Button>
        </div>
      </MiddenModal>
    </MiddenCard>
  );
};

export default RecipeDetail;
