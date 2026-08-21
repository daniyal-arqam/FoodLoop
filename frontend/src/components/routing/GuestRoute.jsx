import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth.js";
import { dashboardPathForRole } from "../../utils/roles.js";
import { AuthLoading } from "./AuthLoading.jsx";

export function GuestRoute() {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) {
    return <AuthLoading />;
  }

  if (isAuthenticated) {
    return <Navigate to={dashboardPathForRole(user.role)} replace />;
  }

  return <Outlet />;
}
