import { Outlet } from "react-router-dom";

import { Navigate } from "react-router-dom";
import { useAuth } from "../../components/Auth/AuthContext";

const ProtectedRoute = () => {
  const { isAuthenticated, isLoading } = useAuth();

  // Show a loading state while checking authentication
  if (isLoading) {
    return <div>Loading...</div>;
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  // Render nested routes if authenticated
  return <Outlet />;
};

export default ProtectedRoute;