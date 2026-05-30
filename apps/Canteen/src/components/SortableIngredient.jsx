import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Button,
  Combobox,
  ComboboxInput,
  ComboboxOption,
  ComboboxOptions,
  Input,
} from "@headlessui/react";

const SortableIngredient = ({
  ing,
  ingIndex,
  groupIndex,
  unresolvedIngredients,
  handleIngredientChange,
  removeIngredient,
  searchResults,
  setIngredientSearchQuery,
  handleOpenIngredientModal,
  baseInputClass,
}) => {
  const isUnresolved = unresolvedIngredients.includes(`${groupIndex}-${ingIndex}`);

  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: ing.uiId,
    data: {
      type: "ingredient",
      groupIndex: groupIndex,
      index: ingIndex,
    },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    position: "relative",
    zIndex: transform ? 50 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="border-grey/50 md:border-grey/30 flex flex-col md:flex-row md:items-stretch gap-2 border border-dashed md:border-solid md:border-0 md:border-b pb-4 pt-0 md:pt-3 md:pb-3 mb-4 md:mb-0 md:last:border-0 bg-dark md:bg-transparent"
    >
      <div className="flex w-full md:w-auto md:order-1 bg-white/10 md:bg-transparent mb-2 md:mb-0">
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab text-lightGrey hover:text-white py-2 md:py-0 md:px-2 flex-1 md:flex-none text-center font-icons icon touch-none flex items-center justify-center transition-colors"
        >
          {"["}
        </div>
        <Button
          type="button"
          onClick={() => removeIngredient(groupIndex, ingIndex)}
          className="md:hidden flex items-center justify-center px-4 font-bold text-red-400 hover:text-red-200"
        >
          ✕
        </Button>
      </div>
      <div className="flex min-w-0 flex-1 flex-wrap gap-2 lg:flex-nowrap md:order-2 px-2 md:px-0">
        <div className="flex w-full md:w-auto gap-2">
          <Input
            type="number"
            min="0"
            step="any"
            placeholder="Qty"
            value={ing.quantity}
            onChange={(e) => {
              const val = e.target.value;
              if (val < 0) return;
              handleIngredientChange(groupIndex, ingIndex, "quantity", val === "0" ? "" : val);
            }}
            className={`${baseInputClass} w-[calc(50%-0.25rem)] md:w-20 flex-none`}
          />
          <Input
            placeholder="Unit"
            value={ing.unit}
            onChange={(e) => handleIngredientChange(groupIndex, ingIndex, "unit", e.target.value)}
            className={`${baseInputClass} w-[calc(50%-0.25rem)] md:w-24 flex-none`}
          />
        </div>
        <div className="relative min-w-[150px] flex-1">
          <Combobox
            value={ing}
            onChange={async (val) => {
              if (typeof val === "object" && val?.action === "create") {
                handleOpenIngredientModal(val.name, groupIndex, ingIndex);
              } else if (val) {
                handleIngredientChange(groupIndex, ingIndex, "id", val.id);
                handleIngredientChange(groupIndex, ingIndex, "name", val.name);
              }
            }}
            immediate
            by={(a, b) => a?.id === b?.id}
          >
            <ComboboxInput
              className={`${baseInputClass} w-full ${
                isUnresolved ? "border-red-500 bg-red-900/20 text-red-200 focus:border-red-500" : ""
              }`}
              placeholder="Name"
              displayValue={(item) => item?.name || ""}
              onChange={(e) => {
                const val = e.target.value;
                handleIngredientChange(groupIndex, ingIndex, "name", val);
                handleIngredientChange(groupIndex, ingIndex, "id", null);
                setIngredientSearchQuery(val);
              }}
              onFocus={() => setIngredientSearchQuery(ing.name)}
            />
            {(searchResults.length > 0 ||
              ((ing.name || "").trim() !== "" &&
                !searchResults.some(
                  (r) => r.name.toLowerCase() === (ing.name || "").toLowerCase(),
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
                    (r) => r.name.toLowerCase() === (ing.name || "").toLowerCase(),
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
          onChange={(e) => handleIngredientChange(groupIndex, ingIndex, "notes", e.target.value)}
          className={`${baseInputClass} w-full min-w-[100px] md:w-auto md:flex-1`}
        />
      </div>
      <Button
        type="button"
        onClick={() => removeIngredient(groupIndex, ingIndex)}
        className="hidden md:flex items-center justify-center px-2 font-bold text-red-400 hover:text-red-200 md:order-3"
      >
        ✕
      </Button>
    </div>
  );
};

export default SortableIngredient;
