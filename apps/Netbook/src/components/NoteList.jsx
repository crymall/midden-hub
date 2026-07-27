import { useState } from "react";

import { clearDraft, getDraftKeys } from "../offline/noteDrafts";
import Note from "./Note";

const NoteList = ({
  fetchingNotes,
  notes,
  handleDeleteNote,
  onUpdateNote,
  updating,
  emptyMessage,
}) => {
  const [expandedId, setExpandedId] = useState(null);
  const [editingId, setEditingId] = useState(null);

  const toggleExpand = (id) => {
    setExpandedId((current) => (current === id ? null : id));
    setEditingId(null);
  };

  const startEdit = (id) => {
    setExpandedId(id);
    setEditingId(id);
  };

  const endEdit = (id) => {
    clearDraft(id);
    setEditingId(null);
  };

  const toggleEdit = (id) => (editingId === id ? endEdit(id) : startEdit(id));

  if (fetchingNotes) {
    return (
      <div className="flex justify-center p-12">
        <p className="text-lightestGrey motion-safe:animate-pulse font-mono text-xl">
          Loading notes...
        </p>
      </div>
    );
  }

  if (notes.length === 0) {
    return (
      <div className="border-grey flex flex-col items-center justify-center border-2 border-dashed p-12 text-center">
        <p className="text-lightGrey font-mono">{emptyMessage}</p>
      </div>
    );
  }

  // Derived per render rather than subscribed: every transition that changes a
  // note's draft also flips state here, so this reflects storage without a
  // store subscription.
  const draftKeys = getDraftKeys();

  return (
    <div className="flex flex-col gap-4">
      {notes.map((note) => (
        <Note
          key={note.id}
          note={note}
          isExpanded={expandedId === note.id}
          isEditing={editingId === note.id}
          hasUnsavedDraft={editingId !== note.id && draftKeys.has(note.id)}
          onToggleExpand={toggleExpand}
          onToggleEdit={toggleEdit}
          onEndEdit={endEdit}
          onUpdateNote={onUpdateNote}
          updating={updating}
          handleDeleteNote={handleDeleteNote}
        />
      ))}
    </div>
  );
};

export default NoteList;
