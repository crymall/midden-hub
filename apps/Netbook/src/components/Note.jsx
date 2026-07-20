import clsx from "clsx";

import NoteForm from "./NoteForm";

const Note = ({
  note,
  isExpanded,
  isEditing,
  hasUnsavedDraft,
  onToggleExpand,
  onToggleEdit,
  onEndEdit,
  onUpdateNote,
  updating,
  handleDeleteNote,
}) => {
  const title = note.title || "Untitled";

  return (
    <div className="group border-grey hover:border-accent flex w-full flex-col border-2 border-dashed transition-colors">
      <div className="flex items-stretch justify-between">
        <h3 className="grow">
          <button
            onClick={() => onToggleExpand(note.id)}
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
                {hasUnsavedDraft && <span className="text-accent ml-2">● unsaved draft</span>}
              </span>
            </span>
          </button>
        </h3>

        <div className="flex shrink-0 items-center">
          <button
            onClick={() => onToggleEdit(note.id)}
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
        <div id={`note-body-${note.id}`} className="border-grey/40 border-t border-dashed p-4">
          {isEditing ? (
            <NoteForm
              initialNote={note}
              draftKey={note.id}
              submitLabel="Save Note"
              loading={updating}
              onCancel={() => onEndEdit(note.id)}
              onSubmit={(noteData) =>
                onUpdateNote(note.id, noteData).then(() => onEndEdit(note.id))
              }
            />
          ) : (
            <p className="text-lightestGrey whitespace-pre-wrap">{note.content}</p>
          )}
        </div>
      )}
    </div>
  );
};

export default Note;
