import { useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  addRecipeIngredient,
  addRecipeTag,
  fetchRecipe,
  removeRecipeGroup,
  removeRecipeIngredient,
  removeRecipeTag,
  reorderRecipeGroups,
  reorderRecipeIngredients,
  updateRecipe,
  updateRecipeGroup,
} from "@shared/core/services/canteenApi";

import MiddenCard from "@shared/ui/components/MiddenCard";
import RecipeForm from "../components/RecipeForm";

const syncIngredientGroups = async (id, originalGroups, updatedGroups) => {
  let finalRecipeIngredientIds = [];

  const updatedGroupIds = updatedGroups.map((g) => String(g.id));
  for (const og of originalGroups) {
    if (!updatedGroupIds.includes(String(og.id)) && og.name !== "Main") {
      await removeRecipeGroup(id, og.id);
    } else {
      const ug = updatedGroups.find((g) => String(g.id) === String(og.id));
      if (ug && ug.name !== og.name && og.name !== "Main") {
        await updateRecipeGroup(id, og.id, ug.name);
      }
    }
  }

  const originalIngs = [];
  originalGroups.forEach((g) => {
    g.ingredients.forEach((i) => originalIngs.push({ ...i, groupName: g.name }));
  });

  const updatedIngs = [];
  updatedGroups.forEach((g) => {
    g.ingredients.forEach((i) => updatedIngs.push({ ...i, groupName: g.name }));
  });

  for (const oi of originalIngs) {
    const match = updatedIngs.find((ui) => String(ui.recipe_ingredient_id) === String(oi.id));
    if (
      !match ||
      match.groupName !== oi.groupName ||
      String(match.quantity) !== String(oi.quantity) ||
      String(match.unit) !== String(oi.unit) ||
      String(match.notes) !== String(oi.notes)
    ) {
      await removeRecipeIngredient(id, oi.ingredient_id, oi.groupName);
    }
  }

  for (const ui of updatedIngs) {
    const match = originalIngs.find((oi) => String(oi.id) === String(ui.recipe_ingredient_id));
    if (
      !match ||
      ui.groupName !== match.groupName ||
      String(match.quantity) !== String(ui.quantity) ||
      String(match.unit) !== String(ui.unit) ||
      String(match.notes) !== String(ui.notes)
    ) {
      const added = await addRecipeIngredient(id, {
        ingredient_id: ui.ingredient_id,
        quantity: ui.quantity,
        unit: ui.unit,
        notes: ui.notes,
        group_name: ui.groupName,
      });
      ui.recipe_ingredient_id = added.id;
    }
    if (ui.recipe_ingredient_id) {
      finalRecipeIngredientIds.push(ui.recipe_ingredient_id);
    }
  }

  const currentRecipe = await fetchRecipe(id);

  const orderedGroupIds = [];
  for (const ug of updatedGroups) {
    const cg = currentRecipe.ingredient_groups.find((g) => g.name === ug.name);
    if (cg) orderedGroupIds.push(cg.id);
  }
  await reorderRecipeGroups(id, orderedGroupIds);

  await reorderRecipeIngredients(id, finalRecipeIngredientIds);
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
      const tagsToAdd = updatedRecipe.tags.filter((t) => !originalTags.includes(t));
      const tagsToRemove = originalTags.filter((t) => !updatedRecipe.tags.includes(t));

      await addAndRemoveRecipeTags(id, tagsToAdd, tagsToRemove);

      const originalGroups = recipe.ingredient_groups || [];
      const updatedGroups = updatedRecipe.ingredient_groups;

      await syncIngredientGroups(id, originalGroups, updatedGroups);
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
      setError("Failed to update recipe. Please check your inputs and try again.");
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
          <p className="text-lightestGrey animate-pulse font-mono text-xl">Loading recipe...</p>
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
              uiId: Math.random().toString(36).substring(2, 9),
              recipe_ingredient_id: i.id,
              ingredient_id: i.ingredient_id,
              name: i.name || "",
              quantity: i.quantity || "",
              unit: i.unit || "",
              notes: i.notes || "",
            })),
          }))
        : [
            {
              id: Math.random().toString(36).substring(2, 9),
              name: "Main",
              ingredients: [
                {
                  uiId: Math.random().toString(36).substring(2, 9),
                  ingredient_id: null,
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
      />
    </MiddenCard>
  );
};

export default EditRecipe;
