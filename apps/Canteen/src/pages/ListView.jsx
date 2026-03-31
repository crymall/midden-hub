import { useEffect, useEffectEvent, useState } from "react";
import { useParams, Link, useNavigate, useLocation } from "react-router-dom";
import useData from "@shared/core/context/data/useData";
import useAuth from "@shared/core/context/auth/useAuth";
import MiddenCard from "@shared/ui/components/MiddenCard";
import RecipeList from "../components/RecipeList";

const ListView = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const { userLists, recipesLoading, getUserLists, getListRecipes, currentListRecipes, currentListId } = useData();
  const navigate = useNavigate();
  const location = useLocation();
  const hasHistory = location.key !== "default";

  const currentList = userLists.find((list) => String(list.id) === String(id));

  const [listFetchCompleted, setListFetchCompleted] = useState(!!currentList);
  const [recipesFetchFailed, setRecipesFetchFailed] = useState(false);

  const setListFetchCompletedEvent = useEffectEvent(() => {
    setListFetchCompleted(true);
  });

  const setListFetchNotCompletedEvent = useEffectEvent(() => {
    setListFetchCompleted(false);
  });

  const setRecipesFetchFailedEvent = useEffectEvent(() => {
    setRecipesFetchFailed(true);
  });

  const setRecipesFetchNotFailedEvent = useEffectEvent(() => {
    setRecipesFetchFailed(false);
  });

  useEffect(() => {
    if (user) {
      if (!currentList) {
        setListFetchNotCompletedEvent();
        getUserLists(user.id).finally(() => setListFetchCompletedEvent());
      } else {
        setListFetchCompletedEvent();
      }
    }
  }, [user, currentList, getUserLists]);

  useEffect(() => {
    if (id) {
      if (String(currentListId) !== String(id)) {
        setRecipesFetchNotFailedEvent();
        getListRecipes(id).then((res) => {
          if (!res) setRecipesFetchFailedEvent();
        });
      }
    }
  }, [id, currentListId, getListRecipes]);

  const isLoading = (!listFetchCompleted) || recipesLoading || (String(currentListId) !== String(id) && !recipesFetchFailed);
  const isNotFound = (listFetchCompleted && !currentList) || recipesFetchFailed;

  if (isNotFound) {
    return (
      <MiddenCard>
        <h2 className="mb-4 font-gothic text-4xl font-bold text-white">
          List Not Found
        </h2>
        <div className="flex flex-col items-center gap-4 p-8">
          <p className="text-lightGrey font-mono">
            The requested list could not be found.
          </p>
          <Link
            to="/my-lists"
            className="text-accent font-bold hover:underline"
          >
            ← Back to My Lists
          </Link>
        </div>
      </MiddenCard>
    );
  }

  return (
    <MiddenCard>
      <div className="mb-6">
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
          <h2 className="font-gothic text-4xl font-bold text-white">
            {currentList?.name || "Loading List..."}
          </h2>
        </div>
        {!hasHistory && (
          <div className="mt-2 flex flex-col gap-2">
            <Link
              to="/my-lists"
              className="text-lightGrey hover:text-white font-mono text-sm transition-colors"
            >
              ← Back to My Lists
            </Link>
          </div>
        )}
      </div>

      <RecipeList
        recipes={currentListRecipes}
        loading={isLoading}
      />
    </MiddenCard>
  );
};

export default ListView;
