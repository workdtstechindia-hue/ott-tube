import { useSelector } from "react-redux";
import { PERMISSIONS } from "../utils/constants";

const useRole = () => {
  const user = useSelector((state) => state.auth.user);

  const role = user?.role;

  const hasPermission = (permissionKey) => {
    if (!role) return false;

    const allowedRoles =
      PERMISSIONS[permissionKey] || [];

    return allowedRoles.includes(role);
  };

  return {
    role,
    hasPermission,
  };
};

export default useRole;
