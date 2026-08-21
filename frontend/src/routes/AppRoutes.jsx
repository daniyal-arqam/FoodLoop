import { Navigate, Route, Routes } from "react-router-dom";
import { PublicLayout } from "../layouts/PublicLayout.jsx";
import { AuthLayout } from "../layouts/AuthLayout.jsx";
import { DashboardLayout } from "../layouts/DashboardLayout.jsx";
import { ProtectedRoute } from "../components/routing/ProtectedRoute.jsx";
import { RoleRoute } from "../components/routing/RoleRoute.jsx";
import { GuestRoute } from "../components/routing/GuestRoute.jsx";
import { HomePage } from "../pages/HomePage.jsx";
import { LoginPage } from "../pages/LoginPage.jsx";
import { RegisterPage } from "../pages/RegisterPage.jsx";
import { NotFoundPage } from "../pages/NotFoundPage.jsx";
import { ProviderDashboardPage } from "../pages/provider/ProviderDashboardPage.jsx";
import { ProviderListingsPage } from "../pages/provider/ProviderListingsPage.jsx";
import { NewListingPage } from "../pages/provider/NewListingPage.jsx";
import { ListingDetailsPage } from "../pages/provider/ListingDetailsPage.jsx";
import { OrganizationDashboardPage } from "../pages/organization/OrganizationDashboardPage.jsx";
import { OrganizationFoodPage } from "../pages/organization/OrganizationFoodPage.jsx";
import { OrganizationFoodDetailsPage } from "../pages/organization/OrganizationFoodDetailsPage.jsx";
import { OrganizationClaimsPage } from "../pages/organization/OrganizationClaimsPage.jsx";
import { AdminDashboardPage } from "../pages/admin/AdminDashboardPage.jsx";
import { AdminOrganizationsPage } from "../pages/admin/AdminOrganizationsPage.jsx";
import { AdminOrganizationDetailsPage } from "../pages/admin/AdminOrganizationDetailsPage.jsx";
import { AdminListingsPage } from "../pages/admin/AdminListingsPage.jsx";
import { AdminListingDetailsPage } from "../pages/admin/AdminListingDetailsPage.jsx";
import { AdminUsersPage } from "../pages/admin/AdminUsersPage.jsx";
import { AdminStatisticsPage } from "../pages/admin/AdminStatisticsPage.jsx";
import { AiPage } from "../pages/ai/AiPage.jsx";
import { USER_ROLES } from "../utils/constants.js";

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>

      <Route element={<GuestRoute />}>
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route element={<RoleRoute roles={[USER_ROLES.PROVIDER]} />}>
            <Route path="/provider" element={<Navigate to="/provider/dashboard" replace />} />
            <Route path="/provider/dashboard" element={<ProviderDashboardPage />} />
            <Route path="/provider/listings/new" element={<NewListingPage />} />
            <Route path="/provider/listings/:listingId" element={<ListingDetailsPage />} />
            <Route path="/provider/listings" element={<ProviderListingsPage />} />
          </Route>

          <Route element={<RoleRoute roles={[USER_ROLES.ORGANIZATION]} />}>
            <Route path="/organization" element={<Navigate to="/organization/dashboard" replace />} />
            <Route path="/organization/dashboard" element={<OrganizationDashboardPage />} />
            <Route path="/organization/food/:listingId" element={<OrganizationFoodDetailsPage />} />
            <Route path="/organization/food" element={<OrganizationFoodPage />} />
            <Route path="/organization/claims" element={<OrganizationClaimsPage />} />
          </Route>

          <Route element={<RoleRoute roles={[USER_ROLES.ADMIN]} />}>
            <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
            <Route path="/admin/organizations/:organizationId" element={<AdminOrganizationDetailsPage />} />
            <Route path="/admin/organizations" element={<AdminOrganizationsPage />} />
            <Route path="/admin/listings/:listingId" element={<AdminListingDetailsPage />} />
            <Route path="/admin/listings" element={<AdminListingsPage />} />
            <Route path="/admin/users" element={<AdminUsersPage />} />
            <Route path="/admin/statistics" element={<AdminStatisticsPage />} />
          </Route>

          <Route path="/ai" element={<AiPage />} />
        </Route>
      </Route>
    </Routes>
  );
}
