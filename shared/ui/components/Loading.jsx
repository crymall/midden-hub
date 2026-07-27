import { useEffect, useState, useSyncExternalStore } from "react";

import MiddenCard from "../components/MiddenCard";

// Midden Icons glyphs "1"-"7","0" render the eight lunar phases in order.
const MOON_PHASES = ["1", "2", "3", "4", "5", "6", "7", "0"];
const FULL_MOON = "5";
const FRAME_MS = 160;

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

const subscribeReducedMotion = (onChange) => {
  const query = window.matchMedia(REDUCED_MOTION_QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
};

const usePrefersReducedMotion = () =>
  useSyncExternalStore(
    subscribeReducedMotion,
    () => window.matchMedia(REDUCED_MOTION_QUERY).matches,
    () => false,
  );

const Loading = ({ message = "Loading..." }) => {
  const prefersReducedMotion = usePrefersReducedMotion();
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    if (prefersReducedMotion) return;

    const id = setInterval(() => {
      setFrame((current) => (current + 1) % MOON_PHASES.length);
    }, FRAME_MS);
    return () => clearInterval(id);
  }, [prefersReducedMotion]);

  const glyph = prefersReducedMotion ? FULL_MOON : MOON_PHASES[frame];

  return (
    <MiddenCard>
      <div className="flex min-h-[60vh] w-full flex-col items-center justify-center gap-8">
        <span
          aria-hidden="true"
          className="font-icons icon text-lightestGrey text-shadow-hard-grey text-7xl md:text-8xl"
        >
          {glyph}
        </span>
        <p
          role="status"
          className="text-lightestGrey motion-safe:animate-pulse font-mono text-xl font-bold tracking-widest uppercase"
        >
          {message}
        </p>
      </div>
    </MiddenCard>
  );
};

export default Loading;
