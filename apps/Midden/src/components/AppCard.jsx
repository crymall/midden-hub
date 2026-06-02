import { useState } from "react";
import { Link } from "react-router-dom";
import clsx from "clsx";

const AppCard = ({ to, symbol, label, description }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const isExternal = to?.startsWith("http");
  const LinkComponent = isExternal ? "a" : Link;
  const linkProps = isExternal
    ? { href: to, target: "_blank", rel: "noopener noreferrer" }
    : { to: to || "/" };

  return (
    <div className="group border-accent flex w-full flex-col border-2 border-dashed transition-colors hover:bg-primary/20 bg-white/5 md:bg-transparent">
      <LinkComponent
        {...linkProps}
        className={clsx(
          "w-full items-center justify-between p-4 md:p-6",
          description ? "hidden md:flex" : "flex",
        )}
      >
        <div className="flex items-center gap-6">
          <span className="text-shadow-hard-grey font-icons text-3xl text-white md:text-5xl inline-block w-12 md:w-16 text-center shrink-0">
            {symbol}
          </span>
          <div className="flex flex-col gap-1 md:gap-2 text-left">
            <span className="text-xl font-bold tracking-wide text-white md:text-3xl">{label}</span>
            {description && (
              <span className="text-sm text-lightestGrey md:text-base group-hover:text-white transition-colors">
                {description}
              </span>
            )}
          </div>
        </div>

        {label !== "Back" && (
          <span className="text-accent group-hover:text-white font-icons icon text-2xl transition-colors md:text-4xl shrink-0 ml-4">
            B
          </span>
        )}
      </LinkComponent>

      {description && (
        <div className="md:hidden flex w-full items-stretch justify-between">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex grow items-center gap-6 p-4 text-left"
            aria-expanded={isExpanded}
            aria-label={isExpanded ? "Collapse description" : "Expand description"}
          >
            <span className="text-shadow-hard-grey font-icons text-3xl text-white inline-block w-12 text-center shrink-0">
              {symbol}
            </span>
            <div className="flex flex-col gap-1 text-left">
              <span className="text-xl font-bold tracking-wide text-white">{label}</span>
            </div>
          </button>

          <LinkComponent
            {...linkProps}
            className={clsx(
              "flex shrink-0 items-center justify-center px-6 transition-colors border-l border-dashed border-white/10",
              isExpanded ? "bg-white/10" : "hover:bg-white/10",
            )}
            aria-label={`Navigate to ${label}`}
          >
            <span
              className={clsx(
                "font-icons icon text-2xl transition-colors",
                isExpanded ? "text-white" : "text-accent group-hover:text-white",
              )}
            >
              B
            </span>
          </LinkComponent>
        </div>
      )}

      {isExpanded && description && (
        <div className="md:hidden border-t border-dashed border-white/10 p-4 font-mono text-sm text-lightestGrey bg-black/20">
          {description}
        </div>
      )}
    </div>
  );
};

export default AppCard;
