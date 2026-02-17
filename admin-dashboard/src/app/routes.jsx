import { Suspense, lazy } from "react";
import { Routes, Route, Navigate } from "react-router-dom";

// Layout
import Layout from "../components/layout/Layout";
import ProtectedRoute from "../components/layout/ProtectedRoute";
import RoleGuard from "../components/layout/RoleGuard";
import PublicRoute from "../components/layout/PublicRoute";
import RouteLoader from "../components/common/RouteLoader";

// Pages
const Login = lazy(() => import("../features/auth/Login"));
const Dashboard = lazy(() => import("../features/dashboard/Dashboard"));
const MovieList = lazy(() => import("../features/movies/MovieList"));
const MovieCreate = lazy(() => import("../features/movies/MovieCreate"));
const MovieEdit = lazy(() => import("../features/movies/MovieEdit"));
const UserList = lazy(() => import("../features/users/UserList"));
const PurchaseList = lazy(() =>
  import("../features/purchases/PurchaseList")
);
const NotFound = lazy(() => import("../features/misc/NotFound"));

const AppRoutes = () => {
  return (
    <Suspense fallback={<RouteLoader />}>
      <Routes>
        {/* Public Route */}
        <Route
          path="/login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />

        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="movies" element={<MovieList />} />
          <Route
            path="movies/create"
            element={
              <RoleGuard permission="MOVIE_MANAGE">
                <MovieCreate />
              </RoleGuard>
            }
          />
          <Route path="movies/:id/edit" element={<MovieEdit />} />
          <Route
            path="users"
            element={
              <RoleGuard permission="USER_MANAGE">
                <UserList />
              </RoleGuard>
            }
          />
          <Route
            path="purchases"
            element={
              <RoleGuard permission="PURCHASE_VIEW">
                <PurchaseList />
              </RoleGuard>
            }
          />
          <Route path="404" element={<NotFound />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/404" replace />} />
      </Routes>
    </Suspense>
  );
};

export default AppRoutes;
