import { useState, useEffect, useEffectEvent } from "react";
import { Button, Field, Label, Input } from "@headlessui/react";
import MiddenModal from "@shared/ui/components/MiddenModal";

const CreateListModal = ({ isOpen, onClose, onCreate, loading }) => {
  const [listName, setListName] = useState("");

  const clearListName = useEffectEvent(() => {
    setListName("");
  });

  useEffect(() => {
    if (isOpen) {
      clearListName();
    }
  }, [isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onCreate(listName);
  };

  return (
    <MiddenModal
      isOpen={isOpen}
      onClose={onClose}
      title="Create New List"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Field>
          <Label className="text-lightestGrey mb-1 block text-sm font-bold">
            List Name
          </Label>
          <Input
            required
            value={listName}
            onChange={(e) => setListName(e.target.value)}
            className="bg-dark border-grey text-lightestGrey focus:border-lightestGrey w-full border p-2 focus:outline-none"
            placeholder="e.g. Weeknight Dinners"
            autoFocus
          />
        </Field>
        <div className="mt-4 flex justify-end gap-2">
          <Button
            type="button"
            onClick={onClose}
            className="text-lightGrey px-4 py-2 font-bold hover:text-white"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={loading}
            className="bg-accent hover:bg-accent/80 px-4 py-2 font-bold text-white disabled:opacity-50"
          >
            {loading ? "Creating..." : "Create List"}
          </Button>
        </div>
      </form>
    </MiddenModal>
  );
};

export default CreateListModal;