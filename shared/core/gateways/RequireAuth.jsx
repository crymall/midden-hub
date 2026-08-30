import { Navigate, Outlet, useLocation } from "react-router-dom";

import Loading from "../../ui/components/Loading";
import { useAuth } from "../hooks/useAuth";

const RequireAuth = () => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <Loading message="Verifying session..." />;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
};

export default RequireAuth;
