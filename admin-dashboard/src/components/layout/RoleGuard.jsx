import useRole from "../../hooks/useRole";
import { Navigate } from "react-router-dom";

const RoleGuard = ({
  permission,
  children,
  fallback = null,
  redirectTo = "/",
}) => {
  const { hasPermission } = useRole();

  if (!hasPermission(permission)) {
    if (fallback) return fallback;
    return <Navigate to={redirectTo} replace />;
  }

  return children;
};

export default RoleGuard;
