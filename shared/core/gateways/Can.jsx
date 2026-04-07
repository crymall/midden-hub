import { useAuth } from "../hooks/useAuth";
import Loading from "../../ui/components/Loading";

const Can = ({ perform, children, not }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <Loading message="Verifying permissions..." />;
  }

  if (!user) return null;

  const hasPermission = user.permissions.includes(perform);

  return hasPermission ? children : not || null;
};

export default Can;
