import { Navigate, Outlet, useLocation } from "react-router-dom";
import useAuth from "../../context/auth/useAuth";

const RequireNotGuest = () => {
  const { user } = useAuth();
  const location = useLocation();

  if (!user || user.username === "guest") {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
};

export default RequireNotGuest;
