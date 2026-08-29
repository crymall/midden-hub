import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { serverMessageOr } from "@shared/core/utils/apiErrors";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { createRecipe } from "@shared/core/services/canteenApi";

import MiddenCard from "@shared/ui/components/MiddenCard";
import RecipeForm from "../components/RecipeForm";

const NewRecipe = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const [error, setError] = useState("");

  const createRecipeMutation = useMutation({
    mutationFn: (payload) => createRecipe(payload),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["searchedRecipes"] });
      queryClient.invalidateQueries({ queryKey: ["userProfileRecipes"] });
      const newId = response.data?.id || response.id;
      navigate(`/recipes/${newId}`, { replace: true });
    },
    onError: (err) => {
      console.error(err);
      setError(
        serverMessageOr(err, "Failed to create recipe. Please check your inputs and try again."),
      );
    },
  });

  const handleSubmit = (payload) => {
    setError("");
    createRecipeMutation.mutate(payload);
  };

  return (
    <MiddenCard>
      <h2 className="mb-4 font-gothic text-4xl font-bold text-white">New Recipe</h2>
      <RecipeForm
        onSubmit={handleSubmit}
        isSubmitting={createRecipeMutation.isPending}
        error={error}
        submitLabel="Create Recipe"
        onCancel={() => {
          if (location.key !== "default" && !location.state?.loginRedirect) {
            navigate(-1);
          } else {
            navigate("/recipes");
          }
        }}
      />
    </MiddenCard>
  );
};

export default NewRecipe;
