import { useState, useEffect, useEffectEvent } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import useData from "@shared/core/context/data/useData";
import MiddenCard from "@shared/ui/components/MiddenCard";
import RecipeForm from "../components/RecipeForm";

const EditRecipe = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { getRecipe, canteenApi, currentRecipe } = useData();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [recipe, setRecipe] = useState(null);
  const [isFetching, setIsFetching] = useState(true);
  const [lastFetchedId, setLastFetchedId] = useState(null);

  const setIsFetchingEvent = useEffectEvent((status) => setIsFetching(status));
  const setRecipeEvent = useEffectEvent((recipe) => setRecipe(recipe));
  const setLastFetchedIdEvent = useEffectEvent((id) => setLastFetchedId(id));

  useEffect(() => {
    if (lastFetchedId === id) return;

    setIsFetchingEvent(true);
    if (currentRecipe && String(currentRecipe.id) === String(id)) {
      setRecipeEvent(currentRecipe);
      setLastFetchedIdEvent(id);
      setIsFetchingEvent(false);
    } else {
      getRecipe(id).then((data) => {
        setRecipeEvent(data);
        setLastFetchedIdEvent(id);
        setIsFetchingEvent(false);
      });
    }
  }, [id, currentRecipe, getRecipe, lastFetchedId]);

  const handleSubmit = async (payload) => {
    setLoading(true);
    setError("");

    try {
      await canteenApi.updateRecipe(id, {
        title: payload.title,
        description: payload.description,
        instructions: payload.instructions,
        prep_time_minutes: payload.prep_time_minutes,
        cook_time_minutes: payload.cook_time_minutes,
        wait_time_minutes: payload.wait_time_minutes,
        servings: payload.servings,
      });

      const originalTags = recipe.tags?.map((t) => t.id) || [];
      const tagsToAdd = payload.tags.filter((t) => !originalTags.includes(t));
      const tagsToRemove = originalTags.filter(
        (t) => !payload.tags.includes(t),
      );

      for (const t of tagsToRemove) {
        await canteenApi.removeRecipeTag(id, t);
      }
      for (const t of tagsToAdd) {
        await canteenApi.addRecipeTag(id, t);
      }

      const originalIngs = recipe.ingredients || [];
      const currentIngs = payload.ingredients;

      for (const oi of originalIngs) {
        const match = currentIngs.find((ci) => String(ci.id) === String(oi.id));
        if (
          !match ||
          String(match.quantity) !== String(oi.quantity) ||
          String(match.unit) !== String(oi.unit) ||
          String(match.notes) !== String(oi.notes)
        ) {
          await canteenApi.removeRecipeIngredient(id, oi.id);
        }
      }
      for (const ci of currentIngs) {
        const match = originalIngs.find(
          (oi) => String(oi.id) === String(ci.id),
        );
        if (
          !match ||
          String(match.quantity) !== String(ci.quantity) ||
          String(match.unit) !== String(ci.unit) ||
          String(match.notes) !== String(ci.notes)
        ) {
          await canteenApi.addRecipeIngredient(id, {
            ingredient_id: ci.id,
            quantity: ci.quantity,
            unit: ci.unit,
            notes: ci.notes,
          });
        }
      }

      await getRecipe(id);

      if (location.state?.fromDetail) {
        navigate(-1);
      } else {
        navigate(`/recipes/${id}`, { replace: true });
      }
    } catch (err) {
      console.error(err);
      setError(
        "Failed to update recipe. Please check your inputs and try again.",
      );
      setLoading(false);
    }
  };

  if (isFetching || lastFetchedId !== id) {
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
        isSubmitting={loading}
        error={error}
        submitLabel="Save Changes"
      />
    </MiddenCard>
  );
};

export default EditRecipe;
