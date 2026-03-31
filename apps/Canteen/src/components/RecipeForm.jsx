import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Button,
  Field,
  Label,
  Input,
  Textarea,
  Popover,
  PopoverButton,
  PopoverPanel,
  Checkbox,
  Combobox,
  ComboboxInput,
  ComboboxOptions,
  ComboboxOption,
} from "@headlessui/react";
import useData from "@shared/core/context/data/useData";
import MiddenModal from "@shared/ui/components/MiddenModal";
import DurationInput from "./DurationInput";

const RecipeForm = ({ initialData, onSubmit, isSubmitting, error, submitLabel = "Save Recipe" }) => {
  const navigate = useNavigate();
  const {
    tags,
    getTags,
    createTag,
    createIngredient,
    getIngredients,
    ingredients: searchResults,
  } = useData();

  const [formData, setFormData] = useState(initialData?.formData || {
    title: "",
    description: "",
    prep_time_minutes: "",
    cook_time_minutes: "",
    wait_time_minutes: "",
    servings: "",
    instructions: "",
  });

  const [ingredients, setIngredients] = useState(initialData?.ingredients || [
    { id: null, name: "", quantity: "", unit: "", notes: "" },
  ]);

  const [selectedTags, setSelectedTags] = useState(initialData?.selectedTags || []);

  const [isTagModalOpen, setIsTagModalOpen] = useState(false);
  const [newTagName, setNewTagName] = useState("");
  const [isIngredientModalOpen, setIsIngredientModalOpen] = useState(false);
  const [pendingIngredientName, setPendingIngredientName] = useState("");
  const [pendingIngredientIndex, setPendingIngredientIndex] = useState(null);
  const [validationError, setValidationError] = useState("");
  const [unresolvedIngredients, setUnresolvedIngredients] = useState([]);
  const [invalidFields, setInvalidFields] = useState([]);

  const handleSearchIngredients = (query) => {
    if (!query) {
      getIngredients(50);
      return;
    }
    getIngredients(10, 0, query);
  };

  useEffect(() => {
    getTags();
    getIngredients(50);
  }, [getTags, getIngredients]);

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    if (type === "number" && value < 0) {
      return;
    }
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleIngredientChange = (index, field, value) => {
    const newIngredients = [...ingredients];
    newIngredients[index][field] = value;
    setIngredients(newIngredients);
  };

  const addIngredient = () => {
    setIngredients([
      ...ingredients,
      { id: null, name: "", quantity: "", unit: "", notes: "" },
    ]);
  };

  const removeIngredient = (index) => {
    if (ingredients.length > 1) {
      const newIngredients = ingredients.filter((_, i) => i !== index);
      setIngredients(newIngredients);
    }
  };

  const toggleTag = (tagId) => {
    setSelectedTags((prev) =>
      prev.includes(tagId)
        ? prev.filter((id) => id !== tagId)
        : [...prev, tagId],
    );
  };

  const handleOpenTagModal = () => {
    setNewTagName("");
    setIsTagModalOpen(true);
  };

  const handleConfirmCreateTag = async () => {
    if (!newTagName.trim()) return;
    try {
      const newTag = await createTag(newTagName);
      setSelectedTags((prev) => [...prev, newTag.id]);
      setNewTagName("");
      setIsTagModalOpen(false);
    } catch (e) {
      console.error(e);
    }
  };

  const handleOpenIngredientModal = (name, index) => {
    setPendingIngredientName(name);
    setPendingIngredientIndex(index);
    setIsIngredientModalOpen(true);
  };

  const handleConfirmCreateIngredient = async () => {
    try {
      const newIng = await createIngredient(pendingIngredientName);
      if (pendingIngredientIndex !== null) {
        const newIngredients = [...ingredients];
        newIngredients[pendingIngredientIndex] = {
          ...newIngredients[pendingIngredientIndex],
          id: newIng.id,
          name: newIng.name,
        };
        setIngredients(newIngredients);
      }
      setIsIngredientModalOpen(false);
      setPendingIngredientName("");
      setPendingIngredientIndex(null);
      getIngredients(50);
    } catch (e) {
      console.error(e);
    }
  };

  const sanitizeNumber = (val) => {
    if (val === "" || val === null || val === undefined) return null;
    const num = Number(val);
    return isNaN(num) ? null : num;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setValidationError("");
    setUnresolvedIngredients([]);
    setInvalidFields([]);

    const sServings = sanitizeNumber(formData.servings);
    const newInvalidFields = [];
    if (!formData.title || !formData.title.trim()) newInvalidFields.push("title");
    if (sServings === null) newInvalidFields.push("servings");
    if (!formData.instructions || !formData.instructions.trim()) newInvalidFields.push("instructions");

    if (newInvalidFields.length > 0) {
      setInvalidFields(newInvalidFields);
      setValidationError("Please fill out all required fields.");
      return;
    }

    const activeIngredients = ingredients.filter((i) => i.name.trim() !== "");

    const unresolvedIndices = [];
    activeIngredients.forEach((ing) => {
      if (!ing.id) {
        unresolvedIndices.push(ingredients.indexOf(ing));
      }
    });

    if (unresolvedIndices.length > 0) {
      setUnresolvedIngredients(unresolvedIndices);
      setValidationError(
        "Please create or select an existing ingredient for the highlighted items.",
      );
      return;
    }

    const payload = {
      ...formData,
      prep_time_minutes: sanitizeNumber(formData.prep_time_minutes),
      cook_time_minutes: sanitizeNumber(formData.cook_time_minutes),
      wait_time_minutes: sanitizeNumber(formData.wait_time_minutes),
      servings: sanitizeNumber(formData.servings),
      ingredients: activeIngredients.map((i) => ({
        ...i,
        quantity: sanitizeNumber(i.quantity),
      })),
      tags: selectedTags,
    };

    onSubmit(payload);
  };

  const baseInputClass =
    "bg-dark border-grey text-lightestGrey focus:border-lightestGrey border p-2 focus:outline-none";

  const renderField = (
    label,
    name,
    type = "text",
    className = "",
    props = {},
  ) => (
    <Field className={className}>
      <Label className="text-lightestGrey mb-1 block text-sm font-bold">
        {label}{props.required ? " *" : ""}
      </Label>
      <Input
        name={name}
        type={type}
        value={formData[name]}
        onChange={handleChange}
        className={`${baseInputClass} w-full ${invalidFields.includes(name) ? "border-red-500 bg-red-900/20 text-red-200 focus:border-red-500" : ""}`}
        {...props}
      />
    </Field>
  );

  const renderTextarea = (
    label,
    name,
    rows = 3,
    className = "",
    placeholder = "",
    required = false,
  ) => (
    <Field className={className}>
      <Label className="text-lightestGrey mb-1 block text-sm font-bold">
        {label}{required ? " *" : ""}
      </Label>
      <Textarea
        name={name}
        value={formData[name]}
        onChange={handleChange}
        rows={rows}
        className={`${baseInputClass} w-full ${invalidFields.includes(name) ? "border-red-500 bg-red-900/20 text-red-200 focus:border-red-500" : ""}`}
        placeholder={placeholder}
      />
    </Field>
  );

  return (
    <>
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6">
        {error && (
          <div className="border border-red-500 bg-red-900/50 p-3 text-sm text-red-200">
            {error}
          </div>
        )}
        {validationError && (
          <div className="border border-red-500 bg-red-900/50 p-3 text-sm text-red-200">
            {validationError}
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-2">
          {renderField("Title", "title", "text", "md:col-span-2", {
            required: true,
          })}
          {renderTextarea("Description", "description", 3, "md:col-span-2")}
          <DurationInput
            label="Prep Time"
            value={formData.prep_time_minutes}
            onChange={(val) =>
              setFormData((prev) => ({ ...prev, prep_time_minutes: val }))
            }
          />
          <DurationInput
            label="Cook Time"
            value={formData.cook_time_minutes}
            onChange={(val) =>
              setFormData((prev) => ({ ...prev, cook_time_minutes: val }))
            }
          />
          <DurationInput
            label="Wait Time"
            value={formData.wait_time_minutes}
            onChange={(val) =>
              setFormData((prev) => ({ ...prev, wait_time_minutes: val }))
            }
          />
          {renderField("Servings", "servings", "number", "", {
            min: "0",
            step: "any",
            required: true,
          })}
          <Field>
            <Label className="text-lightestGrey mb-1 block text-sm font-bold">
              Tags
            </Label>
            <Popover className="relative">
              <PopoverButton className="bg-dark border-grey text-lightestGrey focus:border-lightestGrey flex w-full items-center justify-between border p-2 text-left focus:outline-none">
                <span className="truncate">
                  {selectedTags.length === 0
                    ? "Select tags..."
                    : `${selectedTags.length} tag${selectedTags.length !== 1 ? "s" : ""} selected`}
                </span>
                <span className="ml-2">▼</span>
              </PopoverButton>
              <PopoverPanel className="bg-dark border-grey absolute z-10 mt-1 max-h-60 w-full overflow-auto border p-2 shadow-xl">
                <div className="flex flex-col gap-2">
                  {tags.map((tag) => (
                    <Field
                      key={tag.id}
                      className="text-lightestGrey flex cursor-pointer items-center gap-2 hover:text-white"
                    >
                      <Checkbox
                        checked={selectedTags.includes(tag.id)}
                        onChange={() => toggleTag(tag.id)}
                        className="group border-grey bg-dark data-checked:bg-accent data-checked:border-accent block size-4 border transition-colors"
                      >
                        <svg
                          className="stroke-white opacity-0 group-data-checked:opacity-100"
                          viewBox="0 0 14 14"
                          fill="none"
                        >
                          <path
                            d="M3 8L6 11L11 3.5"
                            strokeWidth={2}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </Checkbox>
                      <Label className="cursor-pointer font-mono text-sm">
                        {tag.name}
                      </Label>
                    </Field>
                  ))}
                  <div className="border-grey mt-2 border-t pt-2">
                    <Button
                      onClick={handleOpenTagModal}
                      className="text-accent w-full text-left text-sm font-bold hover:text-white"
                    >
                      + Create new tag
                    </Button>
                  </div>
                </div>
              </PopoverPanel>
            </Popover>
          </Field>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-lightestGrey block text-sm font-bold">
              Ingredients
            </span>
            <Button
              type="button"
              onClick={addIngredient}
              className="text-accent text-sm font-bold hover:text-white"
            >
              + Add Ingredient
            </Button>
          </div>
          <div className="flex flex-col md:gap-2">
            {ingredients.map((ing, index) => (
              <div
                key={index}
                className="border-grey/30 flex items-stretch gap-2 border-b py-4 last:border-0 md:border-0 md:py-0"
              >
                <div className="flex flex-1 flex-wrap gap-2 md:flex-nowrap">
                  <Input
                    type="number"
                    min="0"
                    step="any"
                    placeholder="Qty"
                    value={ing.quantity}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val < 0) return;
                      handleIngredientChange(
                        index,
                        "quantity",
                        val === "0" ? "" : val,
                      );
                    }}
                    className={`${baseInputClass} w-20 flex-none`}
                  />
                  <Input
                    placeholder="Unit"
                    value={ing.unit}
                    onChange={(e) =>
                      handleIngredientChange(index, "unit", e.target.value)
                    }
                    className={`${baseInputClass} w-24 flex-none`}
                  />
                  <div className="relative min-w-25 flex-1">
                    <Combobox
                      value={ing}
                      onChange={async (val) => {
                        if (
                          typeof val === "object" &&
                          val?.action === "create"
                        ) {
                          handleOpenIngredientModal(val.name, index);
                        } else if (val) {
                          const newIngredients = [...ingredients];
                          newIngredients[index] = {
                            ...newIngredients[index],
                            id: val.id,
                            name: val.name,
                          };
                          setIngredients(newIngredients);
                        }
                      }}
                      immediate
                      by={(a, b) => a?.id === b?.id}
                    >
                      <ComboboxInput
                        className={`${baseInputClass} w-full ${
                          unresolvedIngredients.includes(index)
                            ? "border-red-500 bg-red-900/20 text-red-200 focus:border-red-500"
                            : ""
                        }`}
                        placeholder="Name"
                        displayValue={(item) => item?.name || ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          const newIngredients = [...ingredients];
                          newIngredients[index] = {
                            ...newIngredients[index],
                            name: val,
                            id: null,
                          };
                          setIngredients(newIngredients);
                          handleSearchIngredients(val);
                        }}
                        onFocus={() => handleSearchIngredients(ing.name)}
                      />
                      {(searchResults.length > 0 ||
                        ((ing.name || "").trim() !== "" &&
                          !searchResults.some(
                            (r) =>
                              r.name.toLowerCase() ===
                              (ing.name || "").toLowerCase(),
                          ))) && (
                        <ComboboxOptions className="bg-dark border-grey absolute z-50 mt-1 max-h-60 w-full overflow-auto border p-1 shadow-xl">
                          {searchResults.map((suggestion) => (
                            <ComboboxOption
                              key={suggestion.id}
                              value={suggestion}
                              className="data-focus:bg-accent text-lightestGrey cursor-pointer px-4 py-2 select-none data-focus:text-white"
                            >
                              {suggestion.name}
                            </ComboboxOption>
                          ))}
                          {(ing.name || "").trim() !== "" &&
                            !searchResults.some(
                              (r) =>
                                r.name.toLowerCase() ===
                                (ing.name || "").toLowerCase(),
                            ) && (
                              <ComboboxOption
                                value={{ action: "create", name: ing.name }}
                                className="data-focus:bg-accent text-lightestGrey cursor-pointer px-4 py-2 font-bold italic select-none data-focus:text-white"
                              >
                                {`Create "${ing.name}"`}
                              </ComboboxOption>
                            )}
                        </ComboboxOptions>
                      )}
                    </Combobox>
                  </div>
                  <Input
                    placeholder="Notes"
                    value={ing.notes}
                    onChange={(e) =>
                      handleIngredientChange(index, "notes", e.target.value)
                    }
                    className={`${baseInputClass} w-full flex-none md:w-1/2`}
                  />
                </div>
                <Button
                  type="button"
                  onClick={() => removeIngredient(index)}
                  className="flex items-center justify-center px-2 font-bold text-red-400 hover:text-red-200"
                  disabled={ingredients.length === 1}
                >
                  ✕
                </Button>
              </div>
            ))}
          </div>
        </div>

        {renderTextarea("Instructions", "instructions", 10, "", "Step 1: ...", true)}

        <div className="flex justify-end gap-4 pt-4">
          <Button
            type="button"
            onClick={() => navigate(-1)}
            className="text-lightGrey px-4 py-2 font-bold transition-colors hover:text-white"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="bg-accent hover:bg-accent/80 px-6 py-2 font-bold text-white transition-colors disabled:opacity-50"
          >
            {isSubmitting ? "Saving..." : submitLabel}
          </Button>
        </div>
      </form>

      <MiddenModal
        isOpen={isTagModalOpen}
        onClose={() => setIsTagModalOpen(false)}
        title="Create New Tag"
      >
            <div className="flex flex-col gap-4">
              <Input
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                className={`${baseInputClass} w-full`}
                placeholder="Tag Name"
                autoFocus
              />
              <div className="flex justify-end gap-2">
                <Button
                  onClick={() => setIsTagModalOpen(false)}
                  className="text-lightGrey px-4 py-2 font-bold hover:text-white"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleConfirmCreateTag}
                  className="bg-accent hover:bg-accent/80 px-4 py-2 font-bold text-white"
                >
                  Create
                </Button>
              </div>
            </div>
      </MiddenModal>

      <MiddenModal
        isOpen={isIngredientModalOpen}
        onClose={() => setIsIngredientModalOpen(false)}
        title="Create Ingredient"
      >
            <p className="text-lightestGrey mb-6 font-mono">
              Are you sure you want to create the ingredient{" "}
              <span className="text-accent font-bold">
                {`"${pendingIngredientName}"`}
              </span>
              ?
            </p>
            <div className="flex justify-end gap-2">
              <Button
                onClick={() => setIsIngredientModalOpen(false)}
                className="text-lightGrey px-4 py-2 font-bold hover:text-white"
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirmCreateIngredient}
                className="bg-accent hover:bg-accent/80 px-4 py-2 font-bold text-white"
              >
                Create
              </Button>
            </div>
      </MiddenModal>
    </>
  );
};

export default RecipeForm;