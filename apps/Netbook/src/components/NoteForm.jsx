import { useState } from "react";
import { Button, Field, Input, Label, Textarea } from "@headlessui/react";

import { getDraft, saveDraft } from "../offline/noteDrafts";

const NoteForm = ({ initialNote, onSubmit, onCancel, loading, submitLabel, draftKey }) => {
  // A saved draft is newer typing than the note it was based on, so it wins.
  const [draft] = useState(() => (draftKey ? getDraft(draftKey) : null));
  const [title, setTitle] = useState(draft?.title ?? initialNote?.title ?? "");
  const [content, setContent] = useState(draft?.content ?? initialNote?.content ?? "");

  const persistDraft = (nextTitle, nextContent) => {
    if (draftKey) {
      saveDraft(draftKey, { title: nextTitle, content: nextContent });
    }
  };

  const handleTitleChange = (e) => {
    setTitle(e.target.value);
    persistDraft(e.target.value, content);
  };

  const handleContentChange = (e) => {
    setContent(e.target.value);
    persistDraft(title, e.target.value);
  };

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
          onChange={handleTitleChange}
          className="bg-dark border-grey text-lightestGrey focus:border-lightestGrey w-full border p-2 focus:outline-none"
          placeholder="e.g. Reading List"
          autoFocus
        />
      </Field>
      <Field>
        <Label className="text-lightestGrey mb-1 block text-sm font-bold">Content</Label>
        <Textarea
          value={content}
          onChange={handleContentChange}
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
