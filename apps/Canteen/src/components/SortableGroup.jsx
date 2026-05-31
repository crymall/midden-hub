import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button, Input } from "@headlessui/react";

const SortableGroup = ({
  group,
  groupIndex,
  handleGroupNameChange,
  removeGroup,
  addIngredient,
  children,
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: group.id,
    data: {
      type: "group",
      index: groupIndex,
    },
  });
  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    position: "relative",
    zIndex: isDragging ? 50 : "auto",
  };

  return (
    <div ref={setNodeRef} style={style} className="mb-4 bg-white/5 p-4 border border-grey/30">
      <div className="flex items-center justify-between mb-4 gap-2">
        <div className="flex items-center gap-2 pr-8 md:pr-0">
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab text-lightGrey hover:text-white px-2 font-icons icon touch-none"
          >
            {"["}
          </div>
          {group.name === "Main" ? (
            <span className="text-lightestGrey font-bold block text-sm">Main</span>
          ) : (
            <Input
              value={group.name}
              onChange={(e) => handleGroupNameChange(groupIndex, e.target.value)}
              className="bg-dark border-grey text-lightestGrey focus:border-lightestGrey border p-1 focus:outline-none w-48 text-sm md:w-auto"
              placeholder="Group Name"
            />
          )}
        </div>
        <div>
          {group.name !== "Main" && (
            <Button
              type="button"
              onClick={() => removeGroup(groupIndex)}
              className="text-red-400 hover:text-red-200 text-lg md:text-sm font-bold absolute top-4 right-4 md:static"
            >
              ✕ <span className="hidden md:inline">Remove Group</span>
            </Button>
          )}
        </div>
      </div>

      <SortableContext
        id={group.id}
        items={group.ingredients.map((ing) => ing.uiId)}
        strategy={verticalListSortingStrategy}
      >
        <div className="flex flex-col">{children}</div>
      </SortableContext>

      <Button
        type="button"
        onClick={() => addIngredient(groupIndex)}
        className="text-accent text-sm font-bold hover:text-white mt-4 block"
      >
        + Add Ingredient
      </Button>
    </div>
  );
};

export default SortableGroup;
