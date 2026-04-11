import { useAuth } from "../hooks/useAuth";

const Can = ({ perform, children, not }) => {
  const { user, isLoading } = useAuth();

  if (isLoading || !user) return null;

  const hasPermission = user.permissions.includes(perform);

  return hasPermission ? children : not || null;
};

export default Can;
