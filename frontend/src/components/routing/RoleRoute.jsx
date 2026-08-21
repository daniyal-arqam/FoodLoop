import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth.js";
import { dashboardPathForRole } from "../../utils/roles.js";

export function RoleRoute({ roles }) {
  const { user, hasRole } = useAuth();

  if (!hasRole(roles)) {
    return <Navigate to={dashboardPathForRole(user?.role)} replace />;
  }

  return <Outlet />;
}
