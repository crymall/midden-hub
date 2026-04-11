import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@headlessui/react";
import { PERMISSIONS } from "@shared/core/utils/constants";
import { useQuery } from "@tanstack/react-query";

import { fetchRecipes } from "@shared/core/services/canteenApi";

import Can from "@shared/core/gateways/Can";

import MiddenCard from "@shared/ui/components/MiddenCard";
import PaginationControls from "../components/PaginationControls";
import RecipeFilter from "../components/RecipeFilter";
import RecipeList from "../components/RecipeList";

const RecipeSearch = () => {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [filters, setFilters] = useState({});

  const { data: recipes = [], isLoading: recipesLoading } = useQuery({
    queryKey: ["searchedRecipes", { limit, page, filters }],
    queryFn: () => {
      const { tags, ingredients, title, ids } = filters;
      return fetchRecipes(limit, (page - 1) * limit, tags, ingredients, title, ids);
    },
  });

  const handleFilter = (newFilters) => {
    setFilters(newFilters);
    setPage(1);
  };

  const handlePageChange = (newPage) => {
    setPage(newPage);
  };

  const handleLimitChange = (e) => {
    const newLimit = Number(e.target.value);
    setLimit(newLimit);
    setPage(1);
  };

  const hasFilters = filters.title || (filters.tags && filters.tags.length > 0);

  return (
    <MiddenCard>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-gothic text-4xl font-bold text-white">Find Recipes</h2>
        <Can perform={PERMISSIONS.writeData}>
          <Link to="/recipes/new">
            <Button className="bg-accent hover:bg-accent/80 px-3 py-1 text-sm font-bold text-white transition-colors">
              + Recipe
            </Button>
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
