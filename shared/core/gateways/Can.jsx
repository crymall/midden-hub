import useAuth from "../../context/auth/useAuth";

const Can = ({ perform, children, not }) => {
  const { user } = useAuth();

  if (!user) return null;

  const hasPermission = user.permissions.includes(perform);

  return hasPermission ? children : (not || null);
};

export default Can;
