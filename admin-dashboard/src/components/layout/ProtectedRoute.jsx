import { Navigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { tokenService } from "../../services/tokenService";

const ProtectedRoute = ({ children }) => {
  const token = useSelector((state) => state.auth.token);
  const location = useLocation();
  const authToken = token || tokenService.getToken();

  if (!authToken) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

export default ProtectedRoute;
