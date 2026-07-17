import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@headlessui/react";

import { useAuth } from "@shared/core/hooks/useAuth";

import MiddenCard from "@shared/ui/components/MiddenCard";

const NetbookSplash = ({ preview = false }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Guests and logged-out visitors see the call to action (a guest is a truthy
  // user but not a real sign-in). `preview` forces it on so the /splash-test
  // route shows the whole page even while you're signed in.
  const showCta = preview || !user || user.username === "guest";

  return (
    <MiddenCard>
      <h2 className="font-gothic text-shadow-hard-grey mb-8 text-4xl leading-tight text-white md:text-7xl">
        A quiet place to{" "}
        <span className="border-accent bg-primary/20 hover:bg-primary/40 my-1 inline-block border-2 border-dashed p-2 md:p-4">
          think.
        </span>
      </h2>

      <div className="flex flex-col gap-8 font-mono">
        <section>
          <h3 className="mb-3 text-lg font-bold text-white md:text-2xl">
            Your notebook, and only yours.
          </h3>
          <ul className="text-lightestGrey space-y-2 text-sm md:text-base">
            <li className="flex items-start gap-2">
              <span className="text-accent">•</span>
              <span>Netbook is a private, plain-text notebook. Every note is yours alone.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-accent">•</span>
              <span>It signs you in with your Midden account — no new password to remember.</span>
            </li>
          </ul>
        </section>

        <section>
          <h3 className="mb-3 text-lg font-bold text-white md:text-2xl">
            Nothing between you and the page.
          </h3>
          <ul className="text-lightestGrey space-y-2 text-sm md:text-base">
            <li className="flex items-start gap-2">
              <span className="text-accent">•</span>
              <span>Write, expand to read, edit in place. No menus to hunt through.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-accent">•</span>
              <span>No ads, no tracking, no clutter. Just your notes.</span>
            </li>
          </ul>
        </section>

        <section>
          <h3 className="mb-3 text-lg font-bold text-white md:text-2xl">Built in the open.</h3>
          <ul className="text-lightestGrey space-y-2 text-sm md:text-base">
            <li className="flex items-start gap-2">
              <span className="text-accent">•</span>
              <span>
                Made by a{" "}
                <a
                  href="https://www.reedgaines.com"
                  target="_blank"
                  rel="noreferrer"
                  className="text-accent hover:underline"
                >
                  solo developer
                </a>{" "}
                as part of the Midden family of apps. Open source, open to suggestions.
              </span>
            </li>
          </ul>
        </section>
      </div>

      {showCta && (
        <div className="mt-16 font-mono">
          <Button
            onClick={() => navigate("/login", { state: { from: location } })}
            className="bg-grey hover:bg-accent/80 px-6 py-2 text-lg font-bold text-white transition-colors"
          >
            Login or Register
          </Button>
        </div>
      )}
    </MiddenCard>
  );
};

export default NetbookSplash;
