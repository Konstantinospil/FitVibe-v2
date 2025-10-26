import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";
import Home from "../pages/Home";
import Login from "../pages/Login";
import Dashboard from "../pages/Dashboard";
import Planner from "../pages/Planner";
import Logger from "../pages/Logger";
import Progress from "../pages/Progress";
import Feed from "../pages/Feed";
import Profile from "../pages/Profile";
import NotFound from "../pages/NotFound";

const AppRouter: React.FC = () => (
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<MainLayout />}>
        <Route index element={<Home />} />
        <Route path="login" element={<Login />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="planner" element={<Planner />} />
        <Route path="logger" element={<Logger />} />
        <Route path="progress" element={<Progress />} />
        <Route path="feed" element={<Feed />} />
        <Route path="profile" element={<Profile />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  </BrowserRouter>
);

export default AppRouter;
