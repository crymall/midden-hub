import { useState, useEffect } from "react";
import {
  Button,
  Input,
  Field,
  Label,
  Popover,
  PopoverButton,
  PopoverPanel,
  Checkbox,
} from "@headlessui/react";
import useData from "@shared/core/context/data/useData";

const RecipeFilter = ({ onFilter }) => {
  const { tags, getTags } = useData();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTags, setSelectedTags] = useState([]);

  useEffect(() => {
    getTags();
  }, [getTags]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onFilter({
      title: searchTerm,
      tags: selectedTags,
    });
  };

  const toggleTag = (tagId) => {
    setSelectedTags((prev) =>
      prev.includes(tagId)
        ? prev.filter((id) => id !== tagId)
        : [...prev, tagId],
    );
  };

  const handleClear = () => {
    setSearchTerm("");
    setSelectedTags([]);
    onFilter({ title: "", tags: [] });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="border-grey mb-6 flex flex-col gap-4 border-b-2 pb-6"
    >
      <div className="flex flex-col gap-4 md:flex-row">
        <Field className="flex-1">
          <Label className="text-lightestGrey mb-1 block text-sm font-bold">
            Search Recipes
          </Label>
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by title..."
            className="bg-dark border-grey text-lightestGrey focus:border-lightestGrey w-full border p-2 focus:outline-none"
          />
        </Field>

        {tags && tags.length > 0 && (
          <Field className="w-full md:w-64">
            <Label className="text-lightestGrey mb-1 block text-sm font-bold">
              Filter by Tags
            </Label>
            <Popover className="relative z-30">
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
                      className="text-lightestGrey hover:text-white flex cursor-pointer items-center gap-2"
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
                      <Label className="font-mono text-sm cursor-pointer">{tag.name}</Label>
                    </Field>
                  ))}
                </div>
              </PopoverPanel>
            </Popover>
          </Field>
        )}
      </div>

      <div className="flex gap-4">
        <Button
          type="submit"
          className="bg-grey hover:bg-lightGrey text-dark px-4 py-2 font-bold transition-colors"
        >
          Search
        </Button>
        <Button
          type="button"
          onClick={handleClear}
          className="border-grey text-lightestGrey hover:border-lightestGrey hover:text-white border px-4 py-2 font-bold transition-colors"
        >
          Clear
        </Button>
      </div>
    </form>
  );
};

export default RecipeFilter;