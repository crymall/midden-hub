import { Link } from "react-router-dom";
import { explorerLinkList } from "@shared/core/utils/constants";

import MiddenCard from "@shared/ui/components/MiddenCard";
import AppGrid from "../components/AppGrid";

const Explorer = () => {
  return (
    <MiddenCard>
      <h2 className="font-gothic text-shadow-hard-grey mb-4 text-4xl leading-tight text-white md:text-7xl md:mb-6">
        Check out my work.
      </h2>

      <p className="mb-4 font-mono text-lg text-lightestGrey md:text-xl">
        My name is{" "}
        <a
          href="https://www.reedgaines.com"
          target="_blank"
          rel="noopener noreferrer"
          className="text-white underline hover:text-accent transition-colors"
        >
          Reed Gaines
        </a>
        . Below is a collection of projects I&apos;ve been working on. Some of them are for fun,
        others to show my skills as a web developer.
      </p>

      <p className="mb-12 font-mono text-lg text-lightestGrey md:text-xl">
        If you&apos;d like to read about my professional development work, you can find a few choice
        projects{" "}
        <Link
          to="/professional-showcase"
          className="text-white underline hover:text-accent transition-colors"
        >
          here
        </Link>
        .
      </p>

      <AppGrid items={explorerLinkList} />
    </MiddenCard>
  );
};

export default Explorer;
