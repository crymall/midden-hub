import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import { useAuth } from "@shared/core/hooks/useAuth";
import { fetchListRecipes, fetchUserLists } from "@shared/core/services/canteenApi";

import MiddenCard from "@shared/ui/components/MiddenCard";
import RecipeList from "../components/RecipeList";

const ListView = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const hasHistory = location.key !== "default" && !location.state?.loginRedirect;

  const { data: userLists = [], isLoading: listsLoading } = useQuery({
    queryKey: ["userLists", user?.canteenId],
    queryFn: () => fetchUserLists(user.canteenId, 50, 0),
    enabled: !!user,
  });

  const {
    data: currentListRecipes = [],
    isLoading: recipesLoading,
    isError: recipesFetchFailed,
  } = useQuery({
    queryKey: ["listRecipes", id],
    queryFn: () => fetchListRecipes(id),
    enabled: !!id,
    retry: false,
  });

  const currentList = userLists.find((list) => String(list.id) === String(id));

  const isLoading = listsLoading || recipesLoading;
  const isNotFound = (!listsLoading && !currentList) || recipesFetchFailed;

  if (isNotFound) {
    return (
      <MiddenCard>
        <h2 className="mb-4 font-gothic text-4xl font-bold text-white">List Not Found</h2>
        <div className="flex flex-col items-center gap-4 p-8">
          <p className="text-lightGrey font-mono">The requested list could not be found.</p>
          <Link
            to="/my-lists"
            state={!hasHistory ? { loginRedirect: true } : null}
            className="text-accent font-bold hover:underline"
          >
            <span className={"font-icons icon"}>D</span> Back to My Lists
          </Link>
        </div>
      </MiddenCard>
    );
  }

  return (
    <MiddenCard>
      <div className="mb-6">
        <div className="flex items-center gap-4">
          {hasHistory ? (
            <button
              onClick={() => navigate(-1)}
              className="text-white hover:text-accent text-3xl font-icons icon leading-none transition-colors focus:outline-none"
              aria-label="Go back"
            >
              D
            </button>
          ) : (
            <Link
              to="/my-lists"
              state={{ loginRedirect: true }}
              className="text-white hover:text-accent text-3xl font-icons icon leading-none transition-colors focus:outline-none"
              aria-label="Go back to My Lists"
            >
              D
            </Link>
          )}
          <h2 className="font-gothic text-4xl font-bold text-white">
            {currentList?.name || "Loading List..."}
          </h2>
        </div>
      </div>

      <RecipeList recipes={currentListRecipes} loading={isLoading} />
    </MiddenCard>
  );
};

export default ListView;
