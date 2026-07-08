import { Link } from "react-router-dom";

const NoteList = ({ fetchingNotes, notes, handleDeleteNote, emptyMessage }) => {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {fetchingNotes ? (
        <div className="col-span-full flex justify-center p-12">
          <p className="text-lightestGrey animate-pulse font-mono text-xl">Loading notes...</p>
        </div>
      ) : notes.length === 0 ? (
        <div className="border-grey col-span-full flex flex-col items-center justify-center border-2 border-dashed p-12 text-center">
          <p className="text-lightGrey font-mono">{emptyMessage}</p>
        </div>
      ) : (
        notes.map((note) => (
          <div
            key={note.id}
            className="group border-grey hover:border-accent relative flex flex-col border-2 border-dashed p-4 transition-colors"
          >
            <Link to={`/notes/${note.id}`} className="absolute inset-0 z-0">
              <span className="sr-only">View {note.title || "Untitled"}</span>
            </Link>
            <div className="pointer-events-none relative z-10 flex items-start justify-between gap-2">
              <h3 className="text-accent group-hover:text-white font-mono text-xl font-bold transition-colors">
                {note.title || "Untitled"}
              </h3>
              {handleDeleteNote && (
                <button
                  onClick={(e) => handleDeleteNote(e, note.id)}
                  className="text-grey pointer-events-auto z-20 font-bold transition-colors hover:text-red-400"
                  aria-label={`Delete ${note.title || "Untitled"}`}
                >
                  ✕
                </button>
              )}
            </div>
            <p className="text-grey pointer-events-none relative z-10 mt-1 text-sm">
              {new Date(note.createdAt).toLocaleDateString()}
            </p>
            <p className="text-lightGrey pointer-events-none relative z-10 mt-2 line-clamp-3 whitespace-pre-wrap">
              {note.content}
            </p>
          </div>
        ))
      )}
    </div>
  );
};

export default NoteList;
