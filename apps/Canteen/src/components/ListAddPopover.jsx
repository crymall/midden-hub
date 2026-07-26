import { useState } from "react";
import {
  Button,
  Combobox,
  ComboboxInput,
  ComboboxOption,
  ComboboxOptions,
  Field,
  Input,
  Label,
  Popover,
  PopoverButton,
  PopoverPanel,
} from "@headlessui/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "@shared/core/hooks/useAuth";
import { addRecipeToList, createList, fetchUserLists } from "@shared/core/services/canteenApi";

import MiddenModal from "@shared/ui/components/MiddenModal";

const ListAddPopover = ({
  recipeId,
  className = "",
  buttonClassName = "",
  panelClassName = "",
  label = "+ Add",
}) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isCreateListOpen, setIsCreateListOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [newListName, setNewListName] = useState("");
  const [addListMessage, setAddListMessage] = useState("");

  const { data: comboboxLists = [] } = useQuery({
    queryKey: ["comboboxLists", user?.canteenId, query],
    queryFn: () => fetchUserLists(user.canteenId, 50, 0, query),
    enabled: !!user,
  });

  const handleComboboxChange = (value, close) => {
    if (typeof value === "object" && value?.action === "create") {
      setNewListName(query);
      setIsCreateListOpen(true);
      close();
    } else if (value?.id) {
      addToListMutation.mutate(value.id);
      close();
    }
  };

  const addToListMutation = useMutation({
    mutationFn: (listId) => addRecipeToList(listId, recipeId),
    onSuccess: () => {
      setAddListMessage("Added!");
      queryClient.invalidateQueries({ queryKey: ["comboboxLists"] });
      queryClient.invalidateQueries({ queryKey: ["userLists"] });
      setTimeout(() => setAddListMessage(""), 1500);
    },
    onError: (error) => {
      console.error(error);
      if (error.response && error.response.status === 409) {
        setAddListMessage("Already in list.");
      } else {
        setAddListMessage("Failed.");
      }
      setTimeout(() => setAddListMessage(""), 1500);
    },
  });

  const createListMutation = useMutation({
    mutationFn: (name) => createList(name),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["comboboxLists"] });
      queryClient.invalidateQueries({ queryKey: ["userLists"] });
      if (response?.id) {
        addToListMutation.mutate(response.id);
      }
      setIsCreateListOpen(false);
      setNewListName("");
    },
    onError: (error) => {
      console.error(error);
    },
  });

  const handleCreateList = (e) => {
    e.preventDefault();
    createListMutation.mutate(newListName);
  };

  const handleQueryChange = (event) => {
    setQuery(event.target.value);
  };

  return (
    <>
      <Popover className={className}>
        {({ close }) => (
          <>
            <PopoverButton className={`focus:outline-none ${buttonClassName}`}>
              {addListMessage || label}
            </PopoverButton>
            <PopoverPanel
              className={`bg-dark border-grey absolute z-50 w-64 border p-2 shadow-xl ${panelClassName}`}
            >
              <Combobox onChange={(value) => handleComboboxChange(value, close)} immediate>
                <ComboboxInput
                  className="bg-dark border-grey text-lightestGrey focus:border-lightestGrey w-full border p-1 text-sm focus:outline-none"
                  placeholder="Search or create list..."
                  onChange={handleQueryChange}
                  autoComplete="off"
                  type="search"
                  autoFocus
                />
                {(comboboxLists.length > 0 || query.length > 0) && (
                  <ComboboxOptions className="bg-dark border-grey absolute left-0 right-0 z-50 mt-1 max-h-40 overflow-auto border shadow-lg">
                    {comboboxLists.map((list) => (
                      <ComboboxOption
                        key={list.id}
                        value={list}
                        className="data-focus:bg-accent text-lightestGrey cursor-pointer px-2 py-1 text-sm select-none data-focus:text-dark"
                      >
                        {list.name}
                      </ComboboxOption>
                    ))}
                    {query.length > 0 &&
                      !comboboxLists.some((l) => l.name.toLowerCase() === query.toLowerCase()) && (
                        <ComboboxOption
                          value={{ action: "create" }}
                          className="data-focus:bg-accent text-lightestGrey cursor-pointer px-2 py-1 text-sm font-bold italic select-none data-focus:text-dark"
                        >
                          {`Create "${query}"`}
                        </ComboboxOption>
                      )}
                  </ComboboxOptions>
                )}
              </Combobox>
            </PopoverPanel>
          </>
        )}
      </Popover>

      <MiddenModal
        isOpen={isCreateListOpen}
        onClose={() => setIsCreateListOpen(false)}
        title="Create New List"
      >
        <form onSubmit={handleCreateList} className="flex flex-col gap-4">
          <Field>
            <Label className="text-lightestGrey mb-1 block text-sm font-bold">List Name</Label>
            <Input
              required
              value={newListName}
              onChange={(e) => setNewListName(e.target.value)}
              className="bg-dark border-grey text-lightestGrey focus:border-lightestGrey w-full border p-2 focus:outline-none"
            />
          </Field>
          <div className="mt-2 flex justify-end gap-2">
            <Button
              type="button"
              onClick={() => setIsCreateListOpen(false)}
              className="text-lightGrey px-4 py-2 font-bold hover:text-white"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createListMutation.isPending || addToListMutation.isPending}
              className="bg-accent hover:bg-accent/80 px-4 py-2 font-bold text-dark disabled:opacity-50"
            >
              {createListMutation.isPending || addToListMutation.isPending
                ? "Adding..."
                : "Create & Add"}
            </Button>
          </div>
        </form>
      </MiddenModal>
    </>
  );
};

export default ListAddPopover;
