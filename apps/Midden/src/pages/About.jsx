import MiddenCard from "@shared/ui/components/MiddenCard";

const About = () => {
  return (
    <MiddenCard>
      <div className="space-y-8">
        <section className="pb-8 mb-6 border-b-2 border-dashed border-white/10">
          <h2 className="mb-1 font-gothic text-4xl font-bold text-white">Midden</h2>
          <p className="mb-4 text-sm text-gray-400">(noun) /ˈmɪdən/</p>

          <p>
            An accumulation, deposit, or soil derived from occupation debris, rubbish, or other
            by-products of human activity, such as bone, shell, ash, or decayed organic materials;
            or a pile or mound of such materials, often prehistoric.
          </p>

          <p className="text-xs italic text-gray-500 mt-2">
            Excerpt from the Wiktionary entry for “midden”
          </p>
        </section>

        <section className="space-y-4 leading-relaxed">
          <p>
            In my life so far, one thing has become clear: If you intend to accomplish something,
            don&apos;t make a big deal out of it. Midden is my attempt to reframe my programming
            a/vocation as an archaeological trashheap—something that, at the time, I toss out into
            the world, trusting that in the future, it could be worth something.
          </p>
          <p>
            In other words: Midden is the hub, the locus, the pile, the directory, the place where
            it&apos;s all posted for your perusal. For your convenience, I&apos;ve set up single
            sign on for my entire suite of apps—if you register for one, you&apos;ve got an account
            on them all.
          </p>

          <p>
            Some technical details: Midden and all major sub-apps (unless mentioned otherwise) are
            built in React and styled with Tailwind CSS. The frontends are stored in a monorepo,
            allowing for easy reuse of shared components and utilities. The backend operates off of
            a microservices paradigm. Currently, both backend services are Express apps with
            Postgres databases, but I&apos;m looking to write others in Django or even .NET to build
            my capacity with those frameworks. All applications are containerized with Docker,
            running in a Kubernetes cluster on Akamai Cloud. A full architectural breakdown can be
            found{" "}
            <a
              href="https://github.com/crymall/midden-hub/blob/main/docs/architecture.md"
              target="_blank"
              rel="noopener noreferrer"
              className="text-lightestGrey underline hover:text-white transition-colors"
            >
              here.
            </a>
          </p>

          <p>
            Please don&apos;t hesitate to{" "}
            <a
              href="https://reedgaines.com/contact/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-lightestGrey underline hover:text-white transition-colors"
            >
              drop a line
            </a>{" "}
            if you&apos;re curious about me, have something for me to work on, or have a question
            about this project.
          </p>
        </section>
      </div>
    </MiddenCard>
  );
};

export default About;
