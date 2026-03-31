import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { Button } from "@headlessui/react";
import useData from "@shared/core/context/data/useData";
import MiddenCard from "@shared/ui/components/MiddenCard";
import RecipeList from "../components/RecipeList";
import RecipeFilter from "../components/RecipeFilter";
import PaginationControls from "../components/PaginationControls";
import Can from "@shared/core/gateways/Can";
import { PERMISSIONS } from "@shared/core/utils/constants";

const RecipeSearch = () => {
  const { recipes, recipesLoading, getRecipes, recipesCacheInvalid, setRecipesCacheInvalid } = useData();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [filters, setFilters] = useState({});
  const mounted = useRef(false);

  useEffect(() => {
    if (!mounted.current || recipesCacheInvalid) {
      if (recipes.length === 0 || recipesCacheInvalid) {
        getRecipes(limit, 0, filters);
        if (recipesCacheInvalid) {
          setRecipesCacheInvalid(false);
        }
      }
      mounted.current = true;
    }
  }, [getRecipes, recipes.length, limit, filters, recipesCacheInvalid, setRecipesCacheInvalid]);

  const handleFilter = (newFilters) => {
    setFilters(newFilters);
    setPage(1);
    getRecipes(limit, 0, newFilters);
  };

  const handlePageChange = (newPage) => {
    setPage(newPage);
    getRecipes(limit, (newPage - 1) * limit, filters);
  };

  const handleLimitChange = (e) => {
    const newLimit = Number(e.target.value);
    setLimit(newLimit);
    setPage(1);
    getRecipes(newLimit, 0, filters);
  };

  const hasFilters = filters.title || (filters.tags && filters.tags.length > 0);

  return (
    <MiddenCard>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-gothic text-4xl font-bold text-white">
          Find Recipes
        </h2>
        <Can perform={PERMISSIONS.writeData}>
          <Link to="/recipes/new">
            <Button className="bg-accent hover:bg-accent/80 px-3 py-1 text-sm font-bold text-white transition-colors">+ Recipe</Button>
          </Link>
        </Can>
      </div>
      <RecipeFilter onFilter={handleFilter} />
      <RecipeList
        recipes={recipes}
        loading={recipesLoading}
        emptyMessage={hasFilters ? "No recipes found matching your search." : "No recipes found in the canteen."}
      />

      <PaginationControls
        page={page}
        limit={limit}
        onPageChange={handlePageChange}
        onLimitChange={handleLimitChange}
        loading={recipesLoading}
        isNextDisabled={recipes.length < limit}
      />
    </MiddenCard>
  );
};

export default RecipeSearch;