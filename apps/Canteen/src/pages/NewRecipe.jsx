import { useState } from "react";
import { useNavigate } from "react-router-dom";
import useData from "@shared/core/context/data/useData";
import MiddenCard from "@shared/ui/components/MiddenCard";
import RecipeForm from "../components/RecipeForm";

const NewRecipe = () => {
  const navigate = useNavigate();
  const { createRecipe } = useData();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (payload) => {
    setLoading(true);
    setError("");

    try {
      const response = await createRecipe(payload);
      const newId = response.data?.id || response.id;
      navigate(`/recipes/${newId}`, { replace: true });
    } catch (err) {
      console.error(err);
      setError("Failed to create recipe. Please check your inputs and try again.");
      setLoading(false);
    }
  };

  return (
    <MiddenCard>
      <h2 className="mb-4 font-gothic text-4xl font-bold text-white">
        New Recipe
      </h2>
      <RecipeForm onSubmit={handleSubmit} isSubmitting={loading} error={error} submitLabel="Create Recipe" />
    </MiddenCard>
  );
};

export default NewRecipe;
