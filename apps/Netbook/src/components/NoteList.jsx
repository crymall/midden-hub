import { useState } from "react";
import clsx from "clsx";

import { clearDraft } from "../offline/noteDrafts";
import NoteForm from "./NoteForm";

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

  const collapse = () => {
    setExpandedId(null);
    setEditingId(null);
  };

  const toggleExpand = (id) => {
    if (expandedId === id) {
      collapse();
    } else {
      setExpandedId(id);
      setEditingId(null);
    }
  };

  const toggleEdit = (id) => {
    if (editingId === id) {
      // "Cancel" — back to read view, stays expanded. An explicit cancel
      // discards the draft; an implicit collapse (clicking the title) keeps it.
      clearDraft(id);
      setEditingId(null);
    } else {
      setExpandedId(id);
      setEditingId(id);
    }
  };

  if (fetchingNotes) {
    return (
      <div className="flex justify-center p-12">
        <p className="text-lightestGrey animate-pulse font-mono text-xl">Loading notes...</p>
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

  return (
    <div className="flex flex-col gap-4">
      {notes.map((note) => {
        const isExpanded = expandedId === note.id;
        const isEditing = editingId === note.id;
        const title = note.title || "Untitled";

        return (
          <div
            key={note.id}
            className="group border-grey hover:border-accent flex w-full flex-col border-2 border-dashed transition-colors"
          >
            <div className="flex items-stretch justify-between">
              <h3 className="grow">
                <button
                  onClick={() => toggleExpand(note.id)}
                  aria-expanded={isExpanded}
                  aria-controls={`note-body-${note.id}`}
                  className="flex w-full items-center gap-3 p-4 text-left"
                >
                  <span
                    aria-hidden="true"
                    className={clsx(
                      "text-accent group-hover:text-white text-lg leading-none transition-transform",
                      isExpanded && "rotate-90",
                    )}
                  >
                    ▸
                  </span>
                  <span className="flex flex-col gap-0.5">
                    <span className="text-accent group-hover:text-white font-mono text-xl font-bold transition-colors">
                      {title}
                    </span>
                    <span className="text-grey text-sm font-normal">
                      {new Date(note.createdAt).toLocaleDateString()}
                      {note.pending && <span className="text-accent ml-2">● unsynced</span>}
                    </span>
                  </span>
                </button>
              </h3>

              <div className="flex shrink-0 items-center">
                <button
                  onClick={() => toggleEdit(note.id)}
                  className="text-grey hover:text-accent px-3 font-mono text-sm font-bold transition-colors"
                  aria-label={isEditing ? `Cancel editing ${title}` : `Edit ${title}`}
                >
                  {isEditing ? "Cancel" : "Edit"}
                </button>
                {handleDeleteNote && (
                  <button
                    onClick={(e) => handleDeleteNote(e, note.id)}
                    className="text-grey px-4 font-bold transition-colors hover:text-red-400"
                    aria-label={`Delete ${title}`}
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            {isExpanded && (
              <div
                id={`note-body-${note.id}`}
                className="border-grey/40 border-t border-dashed p-4"
              >
                {isEditing ? (
                  <NoteForm
                    initialNote={note}
                    draftKey={note.id}
                    submitLabel="Save Note"
                    loading={updating}
                    onCancel={() => {
                      clearDraft(note.id);
                      setEditingId(null);
                    }}
                    onSubmit={(noteData) =>
                      onUpdateNote(note.id, noteData).then(() => setEditingId(null))
                    }
                  />
                ) : (
                  <p className="text-lightestGrey whitespace-pre-wrap">{note.content}</p>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default NoteList;
