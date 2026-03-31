import { Link } from "react-router-dom";

const ListList = ({ fetchingLists, userLists, handleDeleteList, emptyMessage }) => {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {fetchingLists ? (
          <div className="col-span-full flex justify-center p-12">
            <p className="text-lightestGrey animate-pulse font-mono text-xl">
              Loading lists...
            </p>
          </div>
        ) : userLists.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center border-2 border-dashed border-grey p-12 text-center">
            <p className="text-lightGrey font-mono">{emptyMessage}</p>
          </div>
        ) : (
          [
            ...userLists.filter((l) => l.name === "Favorites"),
            ...userLists.filter((l) => l.name !== "Favorites"),
          ].map((list) => (
            <div
              key={list.id}
              className="group border-grey hover:border-accent relative flex flex-col border-2 border-dashed p-4 transition-colors"
            >
              <Link
                to={`/my-lists/${list.id}`}
                className="absolute inset-0 z-0"
              >
                <span className="sr-only">View {list.name}</span>
              </Link>
              <div className="pointer-events-none relative z-10 flex items-start justify-between">
                <h3 className="text-accent group-hover:text-white font-mono text-xl font-bold transition-colors">
                  {list.name}
                </h3>
                {list.name !== "Favorites" && handleDeleteList && (
                  <button
                    onClick={(e) => handleDeleteList(e, list.id)}
                    className="pointer-events-auto text-grey hover:text-red-400 z-20 font-bold transition-colors"
                    aria-label={`Delete ${list.name}`}
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
  );
}

export default ListList;