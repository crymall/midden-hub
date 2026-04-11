import { useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  addRecipeIngredient,
  addRecipeTag,
  fetchRecipe,
  removeRecipeIngredient,
  removeRecipeTag,
  updateRecipe,
} from "@shared/core/services/canteenApi";

import MiddenCard from "@shared/ui/components/MiddenCard";
import RecipeForm from "../components/RecipeForm";

const addRemoveAndUpdateIngredients = async (
  id,
  originalIngredients,
  updatedIngredients,
) => {
  for (const ingredient of originalIngredients) {
    const match = updatedIngredients.find(
      (ci) => String(ci.id) === String(ingredient.id),
    );
    if (
      !match ||
      String(match.quantity) !== String(ingredient.quantity) ||
      String(match.unit) !== String(ingredient.unit) ||
      String(match.notes) !== String(ingredient.notes)
    ) {
      await removeRecipeIngredient(id, ingredient.id);
    }
  }

  for (const ingredient of updatedIngredients) {
    const match = originalIngredients.find(
      (oi) => String(oi.id) === String(ingredient.id),
    );
    if (
      !match ||
      String(match.quantity) !== String(ingredient.quantity) ||
      String(match.unit) !== String(ingredient.unit) ||
      String(match.notes) !== String(ingredient.notes)
    ) {
      await addRecipeIngredient(id, {
        ingredient_id: ingredient.id,
        quantity: ingredient.quantity,
        unit: ingredient.unit,
        notes: ingredient.notes,
      });
    }
  }
};

const addAndRemoveRecipeTags = async (id, tagsToAdd, tagsToRemove) => {
  for (const t of tagsToRemove) {
    await removeRecipeTag(id, t);
  }
  for (const t of tagsToAdd) {
    await addRecipeTag(id, t);
  }
};

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
    mutationFn: async (updatedRecipe) => {
      await updateRecipe(id, {
        title: updatedRecipe.title,
        description: updatedRecipe.description,
        instructions: updatedRecipe.instructions,
        prep_time_minutes: updatedRecipe.prep_time_minutes,
        cook_time_minutes: updatedRecipe.cook_time_minutes,
        wait_time_minutes: updatedRecipe.wait_time_minutes,
        servings: updatedRecipe.servings,
      });

      const originalTags = recipe.tags?.map((t) => t.id) || [];
      const tagsToAdd = updatedRecipe.tags.filter(
        (t) => !originalTags.includes(t),
      );
      const tagsToRemove = originalTags.filter(
        (t) => !updatedRecipe.tags.includes(t),
      );

      await addAndRemoveRecipeTags(id, tagsToAdd, tagsToRemove);

      const originalIngredients = recipe.ingredients || [];
      const updatedIngredients = updatedRecipe.ingredients;

      await addRemoveAndUpdateIngredients(
        id,
        originalIngredients,
        updatedIngredients,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recipe", id] });
      queryClient.invalidateQueries({ queryKey: ["searchedRecipes"] });

      if (location.state?.fromDetail) {
        navigate(-1);
      } else {
        navigate(`/recipes/${id}`, { replace: true });
      }
    },
    onError: (err) => {
      console.error(err);
      setError(
        "Failed to update recipe. Please check your inputs and try again.",
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
          <p className="text-lightestGrey animate-pulse font-mono text-xl">
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
    ingredients:
      recipe.ingredients?.length > 0
        ? recipe.ingredients.map((i) => ({
            id: i.id,
            name: i.name || "",
            quantity: i.quantity || "",
            unit: i.unit || "",
            notes: i.notes || "",
          }))
        : [{ id: null, name: "", quantity: "", unit: "", notes: "" }],
    selectedTags: recipe.tags?.map((t) => t.id) || [],
  };

  return (
    <MiddenCard>
      <h2 className="font-gothic mb-4 text-4xl font-bold text-white">
        Edit Recipe
      </h2>
      <RecipeForm
        initialData={initialData}
        onSubmit={handleSubmit}
        isSubmitting={updateRecipeMutation.isPending}
        error={error}
        submitLabel="Save Changes"
      />
    </MiddenCard>
  );
};

export default EditRecipe;
