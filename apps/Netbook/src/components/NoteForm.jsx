import { useState } from "react";
import { Button, Field, Input, Label, Textarea } from "@headlessui/react";

const NoteForm = ({ initialNote, onSubmit, onCancel, loading, submitLabel }) => {
  const [title, setTitle] = useState(initialNote?.title || "");
  const [content, setContent] = useState(initialNote?.content || "");

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ title, content });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Field>
        <Label className="text-lightestGrey mb-1 block text-sm font-bold">Title</Label>
        <Input
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="bg-dark border-grey text-lightestGrey focus:border-lightestGrey w-full border p-2 focus:outline-none"
          placeholder="e.g. Reading List"
          autoFocus
        />
      </Field>
      <Field>
        <Label className="text-lightestGrey mb-1 block text-sm font-bold">Content</Label>
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={12}
          className="bg-dark border-grey text-lightestGrey focus:border-lightestGrey w-full resize-y border p-2 font-mono focus:outline-none"
          placeholder="Write your note..."
        />
      </Field>
      <div className="mt-4 flex justify-end gap-2">
        <Button
          type="button"
          onClick={onCancel}
          className="text-lightGrey px-4 py-2 font-bold hover:text-white"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={loading}
          className="bg-accent hover:bg-accent/80 px-4 py-2 font-bold text-white disabled:opacity-50"
        >
          {loading ? "Saving..." : submitLabel}
        </Button>
      </div>
    </form>
  );
};

export default NoteForm;
