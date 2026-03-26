import { Link } from "react-router-dom";
import MiddenCard from "../components/MiddenCard";

const NotFound = () => {
  return (
    <MiddenCard>
      <div className="mt-4 flex flex-col items-center gap-6 text-center">
        <h2 className="font-gothic mb-4 text-8xl font-bold text-white">404</h2>
        <p className="text-center text-xl">
          The page you are looking for does not exist in this pile.
        </p>
        <Link
          to="/"
          className="text-lightestGrey text-lg underline hover:text-white"
        >
          Return to Midden
        </Link>
      </div>
    </MiddenCard>
  );
};

export default NotFound;
