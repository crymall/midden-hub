import MiddenCard from "@shared/ui/components/MiddenCard";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@headlessui/react";
import useAuth from "@shared/core/context/auth/useAuth";

const CanteenHome = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <MiddenCard>
      <h2 className="font-gothic text-shadow-hard-grey mb-8 text-4xl leading-tight text-white md:text-7xl">
        Find and Share{" "}
        <span className="border-accent bg-primary/20 hover:bg-primary/40 my-1 inline-block border-2 border-dashed p-2 md:p-4">
          Recipes.
        </span>{" "}
        That’s it.
      </h2>

      <div className="flex flex-col gap-8 font-mono">
        <section>
          <h3 className="mb-3 text-lg font-bold text-white md:text-2xl">
            Find the{" "}
            <Link
              to="/recipes"
              className="text-accent hover:underline"
              aria-label="recipe-search"
            >
              perfect recipe
            </Link>
            , or add your own.
          </h3>
          <ul className="text-lightestGrey space-y-2 text-sm md:text-base">
            <li className="flex items-start gap-2">
              <span className="text-accent">•</span>
              <span>
                Canteen makes the community’s best recipes available and
                searchable.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-accent">•</span>
              <span>
                If you have a dish to share, please contribute. It’s like a
                potluck.
              </span>
            </li>
          </ul>
        </section>

        <section>
          <h3 className="mb-3 text-lg font-bold text-white md:text-2xl">
            Curate your own recipe book.
          </h3>
          <ul className="text-lightestGrey space-y-2 text-sm md:text-base">
            <li className="flex items-start gap-2">
              <span className="text-accent">•</span>
              <span>
                Need all your favorite gluten-free breakfasts in one place? Make
                a list.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-accent">•</span>
              <span>
                Share recipes with other Canteen users with the click of a
                button.
              </span>
            </li>
          </ul>
        </section>

        <section>
          <h3 className="mb-3 text-lg font-bold text-white md:text-2xl">
            Community focused. For home cooks, by home cooks.
          </h3>
          <ul className="text-lightestGrey space-y-2 text-sm md:text-base">
            <li className="flex items-start gap-2">
              <span className="text-accent">•</span>
              <span>
                No ads. Ever. Find and reference ingredients and instructions
                without distraction.
              </span>
            </li>
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
                for personal use. Open source, open beta, open to suggestions.
              </span>
            </li>
          </ul>
        </section>
      </div>

      {!user && (
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

export default CanteenHome;
