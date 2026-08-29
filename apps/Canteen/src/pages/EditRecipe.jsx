import { useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { serverMessageOr } from "@shared/core/utils/apiErrors";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { fetchRecipe, updateRecipe } from "@shared/core/services/canteenApi";

import MiddenCard from "@shared/ui/components/MiddenCard";
import RecipeForm from "../components/RecipeForm";

const EditRecipe = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const [error, setError] = useState("");

  const { data: recipe, isLoading: isFetching } = useQuery({
    queryKey: ["recipe", id],
    queryFn: () => fetchRecipe(id),
    enabled: !!id,
  });

  const updateRecipeMutation = useMutation({
    mutationFn: (updatedRecipe) => updateRecipe(id, updatedRecipe),
    onSuccess: (savedRecipe) => {
      queryClient.setQueryData(["recipe", id], savedRecipe);
      queryClient.invalidateQueries({ queryKey: ["searchedRecipes"] });

      if (location.state?.fromDetail && !location.state?.loginRedirect) {
        navigate(-1);
      } else {
        navigate(`/recipes/${id}`, { replace: true });
      }
    },
    onError: (err) => {
      console.error(err);
      setError(
        serverMessageOr(err, "Failed to update recipe. Please check your inputs and try again."),
      );
    },
  });

  const handleSubmit = (payload) => {
    setError("");
    updateRecipeMutation.mutate(payload);
  };

  if (isFetching) {
    return (
      <MiddenCard>
        <div className="flex justify-center p-8">
          <p className="text-lightestGrey motion-safe:animate-pulse font-mono text-xl">
            Loading recipe...
          </p>
        </div>
      </MiddenCard>
    );
  }

  if (!recipe) {
    return (
      <MiddenCard>
        <div className="flex justify-center p-8">
          <p className="text-lightGrey font-mono text-lg">Recipe not found.</p>
        </div>
      </MiddenCard>
    );
  }

  const initialData = {
    formData: {
      title: recipe.title || "",
      description: recipe.description || "",
      prep_time_minutes: recipe.prep_time_minutes || "",
      cook_time_minutes: recipe.cook_time_minutes || "",
      wait_time_minutes: recipe.wait_time_minutes || "",
      servings: recipe.servings || "",
      instructions: recipe.instructions || "",
    },
    ingredientGroups:
      recipe.ingredient_groups?.length > 0
        ? recipe.ingredient_groups.map((g) => ({
            id: g.id,
            name: g.name,
            ingredients: g.ingredients.map((i) => ({
              uiId: crypto.randomUUID(),
              recipe_ingredient_id: i.id,
              id: i.ingredient_id,
              name: i.name || "",
              quantity: i.quantity || "",
              unit: i.unit || "",
              notes: i.notes || "",
            })),
          }))
        : [
            {
              id: crypto.randomUUID(),
              name: "Main",
              ingredients: [
                {
                  uiId: crypto.randomUUID(),
                  id: null,
                  name: "",
                  quantity: "",
                  unit: "",
                  notes: "",
                },
              ],
            },
          ],
    selectedTags: recipe.tags?.map((t) => t.id) || [],
  };

  return (
    <MiddenCard>
      <h2 className="font-gothic mb-4 text-4xl font-bold text-white">Edit Recipe</h2>
      <RecipeForm
        initialData={initialData}
        onSubmit={handleSubmit}
        isSubmitting={updateRecipeMutation.isPending}
        error={error}
        submitLabel="Save Changes"
        onCancel={() => {
          if (location.state?.fromDetail && !location.state?.loginRedirect) {
            navigate(-1);
          } else {
            navigate(`/recipes/${id}`);
          }
        }}
      />
    </MiddenCard>
  );
};

export default EditRecipe;
