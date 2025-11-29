import React, { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import TargetCursor from "./components/TargetCursor.jsx";
import Sidebar from "./components/Sidebar.jsx";

// Lazy imports
const Landing = lazy(() => import("./pages/LandingPage.jsx"));
const Login = lazy(() => import("./pages/LoginPage.jsx"));
const Register = lazy(() => import("./pages/SignupPage.jsx"));
const Dashboard = lazy(() => import("./pages/app/DashBoard.jsx"));
const Transactions = lazy(() => import("./pages/app/Transactions"));
const Insights = lazy(() => import("./pages/app/Insights"));
const Coach = lazy(() => import("./pages/app/Coach"));
const Goals = lazy(() => import("./pages/app/Goals"));
const NotFound = lazy(() => import("./pages/NotFound.jsx"));
const BudgetPage = lazy(() => import("./pages/BudgetPage"));

function getToken() {
  try {
    return localStorage.getItem("token");
  } catch (e) {
    return null;
  }
}

function ProtectedRoute({ children }) {
  const token = getToken();
  if (!token) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      {/* Global Universal Cursor */}
      <TargetCursor 
        spinDuration={2.5}
        hideDefaultCursor={true}
        hoverDuration={0.15}
        parallaxOn={true}
      />

      <Suspense fallback={<div className="p-8 text-white bg-gray-950 min-h-screen flex items-center justify-center">Loading...</div>}>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* App Routes */}
          <Route path="/app/*" element={<ProtectedRoute><AppLayout /></ProtectedRoute>} />
          <Route path="/app/*" element={<AppLayout />} />

          {/* 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
function AppLayout() {
  return (
    <div className="h-screen overflow-hidden flex bg-gray-950 text-gray-100">
      {/* Sidebar: imported component (responsive) */}
      <Sidebar />

      <main className="overflow-y-auto flex-1">
        <Suspense fallback={<div>Loading section...</div>}>
          <Routes>
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="transactions" element={<Transactions />} />
            <Route path="insights" element={<Insights />} />
            <Route path="coach" element={<Coach />} />
            <Route path="goals" element={<Goals />} />
            <Route path="budget" element={<BudgetPage />} />

            {/* default route for /app */}
            <Route path="" element={<Navigate to="dashboard" replace />} />
          </Routes>
        </Suspense>
      </main>
    </div>
  );
}