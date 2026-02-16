import { Routes, Route, Navigate } from "react-router-dom";

// Layout
import Layout from "../components/layout/Layout";
import ProtectedRoute from "../components/layout/ProtectedRoute";
import RoleGuard from "../components/layout/RoleGuard";

// Pages
import Login from "../features/auth/Login";
import Dashboard from "../features/dashboard/Dashboard";
import MovieList from "../features/movies/MovieList";
import MovieCreate from "../features/movies/MovieCreate";
import MovieEdit from "../features/movies/MovieEdit";
import UserList from "../features/users/UserList";
import PurchaseList from "../features/purchases/PurchaseList";

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Route */}
      <Route path="/login" element={<Login />} />

      {/* Protected Routes */}
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
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes;
