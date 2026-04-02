import { useState } from "react";
import {
  Button,
  Field,
  Label,
  Input,
  Popover,
  PopoverButton,
  PopoverPanel,
  Combobox,
  ComboboxInput,
  ComboboxOptions,
  ComboboxOption,
} from "@headlessui/react";
import useData from "@shared/core/context/data/useData";
import useAuth from "@shared/core/context/auth/useAuth";
import MiddenModal from "@shared/ui/components/MiddenModal";

const ListAddPopover = ({
  recipeId,
  className = "",
  buttonClassName = "",
  panelClassName = "",
  label = "+ Add",
}) => {
  const { user } = useAuth();
  const {
    canteenApi,
    comboboxLists,
    getComboboxLists,
    hoistComboboxList,
    comboboxListsLastFetched,
    currentComboboxQuery,
    comboboxListsUserId,
  } = useData();
  const [isCreateListOpen, setIsCreateListOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [newListName, setNewListName] = useState("");
  const [addListMessage, setAddListMessage] = useState("");

  const ensureListsLoaded = () => {
    const STALE_TIME = 60 * 1000;
    const isStale = Date.now() - comboboxListsLastFetched > STALE_TIME;
    const isSearchData = currentComboboxQuery !== "";
    const isDifferentUser = comboboxListsUserId !== user?.canteenId;

    if (user && (isStale || isSearchData || isDifferentUser)) {
      getComboboxLists(user.canteenId);
    }
  };

  const handleComboboxChange = (value, close) => {
    if (typeof value === "object" && value?.action === "create") {
      setNewListName(query);
      setIsCreateListOpen(true);
      close();
    } else if (value?.id) {
      handleAddToList(value.id);
      close();
    }
  };

  const handleAddToList = async (listId) => {
    try {
      await canteenApi.addRecipeToList(listId, recipeId);
      setAddListMessage("Added!");
      hoistComboboxList(listId);

      setTimeout(() => {
        setAddListMessage("");
      }, 1500);
    } catch (error) {
      console.error(error);
      if (error.response && error.response.status === 409) {
        setAddListMessage("Already in list.");
      } else {
        setAddListMessage("Failed.");
      }
      setTimeout(() => {
        setAddListMessage("");
      }, 1500);
    }
  };

  const handleCreateList = async (e) => {
    e.preventDefault();
    try {
      const response = await canteenApi.createList(newListName);
      await getComboboxLists(user.canteenId, newListName);
      if (response?.id) {
        handleAddToList(response.id);
      }
      setIsCreateListOpen(false);
      setNewListName("");
    } catch (error) {
      console.error(error);
    }
  };

  const handleQueryChange = (event) => {
    const val = event.target.value;
    setQuery(val);
    if (val) {
      getComboboxLists(user.canteenId, val);
    } else {
      getComboboxLists(user.canteenId, "");
    }
  };

  return (
    <>
      <Popover className={className}>
        {({ close }) => (
          <>
            <PopoverButton
              onMouseEnter={ensureListsLoaded}
              className={`focus:outline-none ${buttonClassName}`}
            >
              {addListMessage || label}
            </PopoverButton>
            <PopoverPanel
              className={`bg-dark border-grey absolute z-50 w-64 border p-2 shadow-xl ${panelClassName}`}
            >
              <Combobox
                onChange={(value) => handleComboboxChange(value, close)}
                immediate
              >
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
                        className="data-focus:bg-accent text-lightestGrey cursor-pointer px-2 py-1 text-sm select-none data-focus:text-white"
                      >
                        {list.name}
                      </ComboboxOption>
                    ))}
                    {query.length > 0 &&
                      !comboboxLists.some(
                        (l) =>
                          l.name.toLowerCase() === query.toLowerCase(),
                      ) && (
                        <ComboboxOption
                          value={{ action: "create" }}
                          className="data-focus:bg-accent text-lightestGrey cursor-pointer px-2 py-1 text-sm font-bold italic select-none data-focus:text-white"
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
                <Label className="text-lightestGrey mb-1 block text-sm font-bold">
                  List Name
                </Label>
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
                  className="bg-accent hover:bg-accent/80 px-4 py-2 font-bold text-white"
                >
                  Create & Add
                </Button>
              </div>
            </form>
      </MiddenModal>
    </>
  );
};

export default ListAddPopover;