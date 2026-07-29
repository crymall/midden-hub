import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  closestCorners,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
  Button,
  Checkbox,
  Field,
  Input,
  Label,
  Popover,
  PopoverButton,
  PopoverPanel,
  Textarea,
} from "@headlessui/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createIngredient,
  createTag,
  fetchIngredients,
  fetchTags,
} from "@shared/core/services/canteenApi";

import MiddenModal from "@shared/ui/components/MiddenModal";
import DurationInput from "./DurationInput";
import SortableGroup from "./SortableGroup";
import SortableIngredient from "./SortableIngredient";

const generateId = () => crypto.randomUUID();

const RecipeForm = ({
  initialData,
  onSubmit,
  isSubmitting,
  error,
  submitLabel = "Save Recipe",
  onCancel,
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const hasHistory = location.key !== "default" && !location.state?.loginRedirect;

  const [formData, setFormData] = useState(
    initialData?.formData || {
      title: "",
      description: "",
      prep_time_minutes: "",
      cook_time_minutes: "",
      wait_time_minutes: "",
      servings: "",
      instructions: "",
    },
  );

  const [ingredientGroups, setIngredientGroups] = useState(
    initialData?.ingredientGroups || [
      {
        id: generateId(),
        name: "Main",
        ingredients: [
          { uiId: generateId(), id: null, name: "", quantity: "", unit: "", notes: "" },
        ],
      },
    ],
  );

  const [selectedTags, setSelectedTags] = useState(initialData?.selectedTags || []);

  const [isTagModalOpen, setIsTagModalOpen] = useState(false);
  const [newTagName, setNewTagName] = useState("");
  const [isIngredientModalOpen, setIsIngredientModalOpen] = useState(false);
  const [pendingIngredientName, setPendingIngredientName] = useState("");
  const [pendingIngredientIndex, setPendingIngredientIndex] = useState(null); // { gIndex, iIndex }
  const [validationError, setValidationError] = useState("");
  const [unresolvedIngredients, setUnresolvedIngredients] = useState([]);
  const [invalidFields, setInvalidFields] = useState([]);
  const [ingredientSearchQuery, setIngredientSearchQuery] = useState("");

  const customCollisionDetection = (args) => {
    const activeType = args.active.data.current?.type;

    if (!activeType) {
      return closestCorners(args);
    }

    const filteredContainers = args.droppableContainers.filter(
      (container) => container.data.current?.type === activeType,
    );

    return closestCorners({
      ...args,
      droppableContainers: filteredContainers,
    });
  };

  const { data: tags = [] } = useQuery({
    queryKey: ["tags"],
    queryFn: () => fetchTags(500, 0),
  });

  const { data: searchResults = [] } = useQuery({
    queryKey: ["ingredients", ingredientSearchQuery],
    queryFn: () => fetchIngredients(50, 0, ingredientSearchQuery),
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    if (type === "number" && value < 0) {
      return;
    }
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over) return;

    const activeType = active.data.current?.type;
    const overType = over.data.current?.type;

    if (activeType === "group" && overType === "group") {
      if (active.id !== over.id) {
        setIngredientGroups((groups) => {
          const oldIndex = groups.findIndex((g) => g.id === active.id);
          const newIndex = groups.findIndex((g) => g.id === over.id);
          return arrayMove(groups, oldIndex, newIndex);
        });
      }
    } else if (activeType === "ingredient" && overType === "ingredient") {
      const activeGroupIdx = active.data.current.groupIndex;
      const overGroupIdx = over.data.current.groupIndex;

      if (activeGroupIdx === overGroupIdx && active.id !== over.id) {
        setIngredientGroups((groups) => {
          const newGroups = [...groups];
          const oldIndex = newGroups[activeGroupIdx].ingredients.findIndex(
            (i) => i.uiId === active.id,
          );
          const newIndex = newGroups[activeGroupIdx].ingredients.findIndex(
            (i) => i.uiId === over.id,
          );

          newGroups[activeGroupIdx] = {
            ...newGroups[activeGroupIdx],
            ingredients: arrayMove(newGroups[activeGroupIdx].ingredients, oldIndex, newIndex),
          };

          return newGroups;
        });
      }
    }
  };

  const addGroup = () => {
    setIngredientGroups([
      ...ingredientGroups,
      {
        id: generateId(),
        name: `Group ${ingredientGroups.length + 1}`,
        ingredients: [
          { uiId: generateId(), id: null, name: "", quantity: "", unit: "", notes: "" },
        ],
      },
    ]);
  };

  const removeGroup = (index) => {
    setIngredientGroups(ingredientGroups.filter((_, i) => i !== index));
  };

  const handleGroupNameChange = (index, val) => {
    const newGroups = [...ingredientGroups];
    newGroups[index].name = val;
    setIngredientGroups(newGroups);
  };

  const handleIngredientChange = (gIndex, iIndex, field, value) => {
    const newGroups = [...ingredientGroups];
    newGroups[gIndex].ingredients[iIndex][field] = value;
    setIngredientGroups(newGroups);
  };

  const addIngredient = (gIndex) => {
    const newGroups = [...ingredientGroups];
    newGroups[gIndex].ingredients.push({
      uiId: generateId(),
      id: null,
      name: "",
      quantity: "",
      unit: "",
      notes: "",
    });
    setIngredientGroups(newGroups);
  };

  const removeIngredient = (gIndex, iIndex) => {
    const newGroups = [...ingredientGroups];
    newGroups[gIndex].ingredients = newGroups[gIndex].ingredients.filter((_, i) => i !== iIndex);
    setIngredientGroups(newGroups);
  };

  const toggleTag = (tagId) => {
    setSelectedTags((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId],
    );
  };

  const handleOpenTagModal = () => {
    setNewTagName("");
    setIsTagModalOpen(true);
  };

  const createTagMutation = useMutation({
    mutationFn: (name) => createTag(name),
    onSuccess: (newTag) => {
      queryClient.invalidateQueries({ queryKey: ["tags"] });
      setSelectedTags((prev) => [...prev, newTag.id]);
      setNewTagName("");
      setIsTagModalOpen(false);
    },
    onError: (e) => console.error(e),
  });

  const handleConfirmCreateTag = () => {
    if (!newTagName.trim()) return;
    createTagMutation.mutate(newTagName);
  };

  const handleOpenIngredientModal = (name, gIndex, iIndex) => {
    setPendingIngredientName(name);
    setPendingIngredientIndex({ gIndex, iIndex });
    setIsIngredientModalOpen(true);
  };

  const createIngredientMutation = useMutation({
    mutationFn: (name) => createIngredient(name),
    onSuccess: (newIng) => {
      queryClient.invalidateQueries({ queryKey: ["ingredients"] });
      if (pendingIngredientIndex !== null) {
        const { gIndex, iIndex } = pendingIngredientIndex;
        const newGroups = [...ingredientGroups];
        newGroups[gIndex].ingredients[iIndex] = {
          ...newGroups[gIndex].ingredients[iIndex],
          id: newIng.id,
          name: newIng.name,
        };
        setIngredientGroups(newGroups);
      }
      setIsIngredientModalOpen(false);
      setPendingIngredientName("");
      setPendingIngredientIndex(null);
    },
    onError: (e) => console.error(e),
  });

  const handleConfirmCreateIngredient = () => {
    createIngredientMutation.mutate(pendingIngredientName);
  };

  const sanitizeNumber = (val) => {
    if (val === "" || val === null || val === undefined) return null;
    const str = String(val).trim();

    const num = Number(str);
    if (!isNaN(num)) return num < 0 ? null : num;

    // Try parsing fractions (e.g., "1/2", "1 1/2", "1-1/2", "3 / 4")
    const fractionMatch = str.match(/^(\d+[\s-]+)?(\d+)\s*\/\s*(\d+)$/);
    if (fractionMatch) {
      let whole = 0;
      if (fractionMatch[1]) {
        whole = parseInt(fractionMatch[1].replace(/[\s-]/g, ""), 10);
      }
      const numerator = parseInt(fractionMatch[2], 10);
      const denominator = parseInt(fractionMatch[3], 10);
      if (denominator !== 0) {
        return whole + numerator / denominator;
      }
    }

    return null;
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
    if (!formData.instructions || !formData.instructions.trim())
      newInvalidFields.push("instructions");

    if (newInvalidFields.length > 0) {
      setInvalidFields(newInvalidFields);
      setValidationError("Please fill out all required fields.");
      return;
    }

    const activeGroups = ingredientGroups
      .map((group) => ({
        ...group,
        ingredients: group.ingredients.filter((i) => i.name.trim() !== ""),
      }))
      .filter((group) => group.ingredients.length > 0 || group.name === "Main");

    const unresolvedIndices = [];
    activeGroups.forEach((group, gIdx) => {
      group.ingredients.forEach((ing, iIdx) => {
        if (!ing.id) {
          unresolvedIndices.push(`${gIdx}-${iIdx}`);
        }
      });
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
      ingredient_groups: activeGroups.map((g) => ({
        id: g.id,
        name: g.name,
        ingredients: g.ingredients.map((i) => ({
          ...i,
          quantity: sanitizeNumber(i.quantity),
        })),
      })),
      tags: selectedTags,
    };

    onSubmit(payload);
  };

  const baseInputClass =
    "bg-dark border-grey text-lightestGrey focus:border-lightestGrey border p-2 focus:outline-none";

  const renderField = (label, name, type = "text", className = "", props = {}) => (
    <Field className={className}>
      <Label className="text-lightestGrey mb-1 block text-sm font-bold">
        {label}
        {props.required ? " *" : ""}
      </Label>
      <Input
        name={name}
        type={type}
        value={formData[name]}
        onChange={handleChange}
        disabled={props.disabled}
        className={`${baseInputClass} w-full ${invalidFields.includes(name) ? "border-red-500 bg-red-900/20 text-red-200 focus:border-red-500" : ""} disabled:opacity-50`}
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
        {label}
        {required ? " *" : ""}
      </Label>
      <Textarea
        name={name}
        value={formData[name]}
        onChange={handleChange}
        rows={rows}
        className={`${baseInputClass} w-full ${invalidFields.includes(name) ? "border-red-500 bg-red-900/20 text-red-200 focus:border-red-500" : ""} disabled:opacity-50`}
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
            onChange={(val) => setFormData((prev) => ({ ...prev, prep_time_minutes: val }))}
          />
          <DurationInput
            label="Cook Time"
            value={formData.cook_time_minutes}
            onChange={(val) => setFormData((prev) => ({ ...prev, cook_time_minutes: val }))}
          />
          <DurationInput
            label="Wait Time"
            value={formData.wait_time_minutes}
            onChange={(val) => setFormData((prev) => ({ ...prev, wait_time_minutes: val }))}
          />
          {renderField("Servings", "servings", "number", "", {
            min: "0",
            step: "any",
            required: true,
          })}
          <Field>
            <Label
              htmlFor="tags-popover-button"
              className="text-lightestGrey mb-1 block text-sm font-bold"
            >
              Tags
            </Label>
            <Popover className="relative">
              <PopoverButton
                id="tags-popover-button"
                className="bg-dark border-grey text-lightestGrey focus:border-lightestGrey flex w-full items-center justify-between border p-2 text-left focus:outline-none disabled:opacity-50"
              >
                <span className="truncate">
                  {selectedTags.length === 0
                    ? "Select tags..."
                    : `${selectedTags.length} tag${selectedTags.length !== 1 ? "s" : ""} selected`}
                </span>
                <span className="ml-2 font-icons icon">C</span>
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
                      <Label className="cursor-pointer font-mono text-sm">{tag.name}</Label>
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
            <span className="text-lightestGrey block text-sm font-bold">Ingredients</span>
            <div className="flex gap-4">
              <Button
                type="button"
                onClick={addGroup}
                className="text-accent text-sm font-bold hover:text-white"
              >
                + Add Group
              </Button>
            </div>
          </div>
          <DndContext
            id="recipe-groups-context"
            sensors={sensors}
            collisionDetection={customCollisionDetection}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              id="groups-context"
              items={ingredientGroups.map((g) => g.id)}
              strategy={verticalListSortingStrategy}
            >
              {ingredientGroups.map((group, groupIndex) => (
                <SortableGroup
                  key={group.id}
                  group={group}
                  groupIndex={groupIndex}
                  handleGroupNameChange={handleGroupNameChange}
                  removeGroup={removeGroup}
                  addIngredient={addIngredient}
                >
                  {group.ingredients.map((ing, ingIndex) => (
                    <SortableIngredient
                      key={ing.uiId}
                      ing={ing}
                      ingIndex={ingIndex}
                      groupIndex={groupIndex}
                      unresolvedIngredients={unresolvedIngredients}
                      handleIngredientChange={handleIngredientChange}
                      removeIngredient={removeIngredient}
                      searchResults={searchResults}
                      setIngredientSearchQuery={setIngredientSearchQuery}
                      handleOpenIngredientModal={handleOpenIngredientModal}
                      ingredientsLength={group.ingredients.length}
                      baseInputClass={baseInputClass}
                    />
                  ))}
                </SortableGroup>
              ))}
            </SortableContext>
          </DndContext>
        </div>

        {renderTextarea("Instructions", "instructions", 10, "", "Step 1: ...", true)}

        <div className="flex justify-end gap-4 pt-4">
          <Button
            type="button"
            onClick={() => {
              if (onCancel) {
                onCancel();
              } else if (hasHistory) {
                navigate(-1);
              } else {
                navigate("/recipes");
              }
            }}
            className="text-lightGrey px-4 py-2 font-bold transition-colors hover:text-white disabled:opacity-50"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="bg-accent hover:bg-accent/80 px-6 py-2 font-bold text-dark transition-colors disabled:opacity-50"
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
              disabled={createTagMutation.isPending}
              className="bg-accent hover:bg-accent/80 px-4 py-2 font-bold text-dark disabled:opacity-50"
            >
              {createTagMutation.isPending ? "Creating..." : "Create"}
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
          <span className="text-accent font-bold">{`"${pendingIngredientName}"`}</span>?
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
            disabled={createIngredientMutation.isPending}
            className="bg-accent hover:bg-accent/80 px-4 py-2 font-bold text-dark disabled:opacity-50"
          >
            {createIngredientMutation.isPending ? "Creating..." : "Create"}
          </Button>
        </div>
      </MiddenModal>
    </>
  );
};

export default RecipeForm;
