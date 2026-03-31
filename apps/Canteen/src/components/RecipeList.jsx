import RecipeCard from "./RecipeCard";

const RecipeList = ({ recipes, loading, emptyMessage = "No recipes found in the canteen." }) => {
  if (loading) {
    return (
      <div className="flex w-full justify-center p-8">
        <p className="text-lightestGrey font-mono text-xl animate-pulse">
          Loading recipes...
        </p>
      </div>
    );
  }

  if (!recipes || recipes.length === 0) {
    return (
      <div className="flex w-full justify-center p-8">
        <p className="text-lightGrey font-mono text-lg">
          {emptyMessage}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {recipes.map((recipe) => (
        <RecipeCard key={recipe.id} recipe={recipe} />
      ))}
    </div>
  );
};

export default RecipeList;