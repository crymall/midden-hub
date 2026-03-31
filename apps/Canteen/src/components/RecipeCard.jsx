import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import Can from "@shared/core/gateways/Can";
import ListAddPopover from "./ListAddPopover";
import { PERMISSIONS } from "@shared/core/utils/constants";

const RecipeCard = ({ recipe, inverse = false }) => {
  const [showLeft, setShowLeft] = useState(false);
  const [showRight, setShowRight] = useState(false);
  const scrollContainerRef = useRef(null);

  const checkScroll = () => {
    const el = scrollContainerRef.current;
    if (el) {
      const { scrollLeft, scrollWidth, clientWidth } = el;
      setShowLeft(scrollLeft > 0);
      setShowRight(scrollLeft + clientWidth < scrollWidth - 1);
    }
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener("resize", checkScroll);
    return () => window.removeEventListener("resize", checkScroll);
  }, [recipe.tags]);

  const truncateDescription = (text) => {
    if (!text) return "";
    if (text.length <= 150) return text;
    const sub = text.substring(0, 150);
    const lastSpace = sub.lastIndexOf(" ");
    return (lastSpace > 0 ? sub.substring(0, lastSpace) : sub) + "...";
  };

  let maskImage = "none";
  if (showLeft && showRight) {
    maskImage =
      "linear-gradient(to right, transparent, black 2rem, black calc(100% - 2rem), transparent)";
  } else if (showLeft) {
    maskImage = "linear-gradient(to right, transparent, black 2rem)";
  } else if (showRight) {
    maskImage =
      "linear-gradient(to right, black calc(100% - 2rem), transparent)";
  }

  return (
    <>
      <div
        className={`group relative flex flex-col gap-2 border-2 border-dashed p-4 transition-all ${
          inverse
            ? "bg-dark/50 border-lightestGrey hover:bg-dark/70"
            : "bg-primary/20 border-accent hover:bg-primary/40"
        }`}
      >
        <Link
          to={`/recipes/${recipe.id}`}
          className="absolute inset-0 z-0"
        >
          <span className="sr-only">View {recipe.title}</span>
        </Link>

        <div className="pointer-events-none relative z-10 flex items-start justify-between gap-2">
          <h3 className="group-hover:text-lightestGrey font-mono text-xl font-bold text-white transition-colors">
            {recipe.title}
          </h3>
        </div>

        <p className="text-lightGrey pointer-events-none relative z-10 mb-2 font-mono text-sm">
          {truncateDescription(recipe.description)}
        </p>

        <div className="pointer-events-none relative z-10 mt-auto flex items-end justify-between gap-4">
          <div
            ref={scrollContainerRef}
            onScroll={checkScroll}
            className="pointer-events-auto flex flex-1 min-w-0 gap-2 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
            style={{ maskImage, WebkitMaskImage: maskImage }}
          >
            {recipe.tags &&
              recipe.tags.map((tag) => (
                <span
                  key={tag.id}
                  className="bg-accent/30 text-lightestGrey border-accent/50 whitespace-nowrap border px-2 py-0.5 text-xs font-bold"
                >
                  {tag.name}
                </span>
              ))}
          </div>
          <div className="flex shrink-0 items-center gap-3">
            {recipe.likes && recipe.likes.length > 0 && (
              <span className="text-accent font-mono text-xs font-bold">
                ♥{" "}
                {Intl.NumberFormat("en-US", { notation: "compact" }).format(
                  recipe.likes.length,
                )}
              </span>
            )}
            <Can perform={PERMISSIONS.writeData}>
              <ListAddPopover
                recipeId={recipe.id}
                className="pointer-events-auto relative z-20"
                buttonClassName="bg-grey hover:bg-lightGrey text-dark px-2 py-1 text-xs font-bold transition-colors focus:outline-none"
                panelClassName="right-0 bottom-full mb-2"
                label="+ Add"
              />
            </Can>
          </div>
        </div>
      </div>
    </>
  );
};

export default RecipeCard;
