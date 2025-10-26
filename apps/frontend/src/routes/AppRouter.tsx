import React from \"react\";
import { BrowserRouter, Routes, Route, Navigate } from \"react-router-dom\";
import { AuthProvider } from \"../contexts/AuthContext\";
import ProtectedRoute from \"../components/ProtectedRoute\";
import MainLayout from \"../layouts/MainLayout\";
import Home from \"../pages/Home\";
import Login from \"../pages/Login\";
import Register from \"../pages/Register\";
import Dashboard from \"../pages/Dashboard\";
import Planner from \"../pages/Planner\";
import Logger from \"../pages/Logger\";
import Progress from \"../pages/Progress\";
import Feed from \"../pages/Feed\";
import Profile from \"../pages/Profile\";
import NotFound from \"../pages/NotFound\";

const AppRouter: React.FC = () => (
  <AuthProvider>
    <BrowserRouter>
      <Routes>
        <Route element={<ProtectedRoute />}>
          <Route element={<MainLayout />}>
            <Route index element={<Home />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="planner" element={<Planner />} />
            <Route path="logger" element={<Logger />} />
            <Route path="progress" element={<Progress />} />
            <Route path="feed" element={<Feed />} />
            <Route path="profile" element={<Profile />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Route>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  </AuthProvider>
);

export default AppRouter;
