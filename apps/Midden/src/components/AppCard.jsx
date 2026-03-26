import { useState, useRef } from "react";
import { Link } from "react-router-dom";
import clsx from "clsx";

const AppCard = ({ to, symbol, label, description }) => {
  const [alignRight, setAlignRight] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const cardRef = useRef(null);

  const handleMouseEnter = () => {
    if (cardRef.current) {
      const rect = cardRef.current.getBoundingClientRect();
      setAlignRight(rect.left > window.innerWidth / 2);
    }
  };

  const isExternal = to.startsWith("http");

  const wrapperClass = clsx(
    "relative group text-white",
    "w-full flex flex-col bg-white/5 sm:bg-transparent",
    "sm:aspect-square sm:flex-col sm:items-center sm:justify-center sm:hover:bg-opacity-90 sm:hover:z-50",
    "sm:w-30 md:w-46",
  );

  const contentClass = clsx(
    "flex flex-1 items-center p-4",
    "sm:flex-col sm:justify-center sm:p-0 sm:w-full sm:h-full",
  );

  const symbolClass = clsx(
    "text-3xl mr-6",
    "sm:mr-0 sm:text-4xl sm:mb-2",
    "md:text-5xl",
  );

  const labelClass = clsx(
    "text-sm font-bold tracking-wide",
    "md:text-base sm:font-normal sm:text-center sm:leading-tight",
  );

  const content = (
    <div className={contentClass}>
      <div className={symbolClass}>{symbol}</div>
      <div className={labelClass}>{label}</div>
    </div>
  );

  const desktopTooltip = description && (
    <div
      className={clsx(
        "bg-lightGrey border-accent pointer-events-none absolute top-full z-50 hidden w-[170%] border-4 border-dashed p-4 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100 sm:block md:-mt-4",
        alignRight ? "right-0 translate-x-4" : "left-0 -translate-x-4",
      )}
    >
      <p className="md:text-base text-dark text-left font-mono text-sm">
        {description}
      </p>
    </div>
  );

  const mobileDescription = description && isExpanded && (
    <div className="bg-black/20 p-4 text-sm text-lightestGrey border-t border-white/10 sm:hidden font-mono">
      {description}
    </div>
  );

  const LinkComponent = isExternal ? "a" : Link;
  const linkProps = isExternal
    ? { href: to, target: "_blank", rel: "noopener noreferrer" }
    : { to };

  return (
    <div
      ref={cardRef}
      className={wrapperClass}
      onMouseEnter={handleMouseEnter}
    >
      <div className="flex w-full">
        <LinkComponent
          {...linkProps}
          className="grow hover:bg-white/10 sm:hover:bg-transparent transition-colors"
          aria-label={label}
        >
          {content}
        </LinkComponent>

      {description && (
        <button
          onClick={(e) => {
            e.preventDefault();
            setIsExpanded(!isExpanded);
          }}
          className="flex items-center justify-center px-6 text-lightestGrey hover:text-white hover:bg-white/10 sm:hidden transition-colors"
          aria-label={
            isExpanded ? "Collapse description" : "Expand description"
          }
        >
          <span className="text-xl">{isExpanded ? "▲" : "▼"}</span>
        </button>
      )}
      </div>

      {mobileDescription}
      {desktopTooltip}
    </div>
  );
};

export default AppCard;
