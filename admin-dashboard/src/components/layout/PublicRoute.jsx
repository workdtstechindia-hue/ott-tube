import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { tokenService } from "../../services/tokenService";

const PublicRoute = ({ children }) => {
  const token = useSelector((state) => state.auth.token);
  const authToken = token || tokenService.getToken();

  if (authToken) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default PublicRoute;
