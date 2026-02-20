import React, { useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import WelcomePage from "./WelcomePage";
import UserAuthPage from "./UserAuthPage";
import AdminLogin from "./AdminLogin";
import AdminDashboard from "./AdminDashboard";

function App() {
  const [admin, setAdmin] = useState(null);

  const handleAdminLoginSuccess = (adminData) => {
    setAdmin(adminData);
  };

  const handleLogout = () => {
    setAdmin(null);
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<WelcomePage />} />
        <Route path="/user-auth" element={<UserAuthPage />} />
        <Route
          path="/admin-login"
          element={
            admin ? (
              <Navigate to="/admin-dashboard" />
            ) : (
              <AdminLogin onLoginSuccess={handleAdminLoginSuccess} />
            )
          }
        />
        <Route
          path="/admin-dashboard"
          element={
            admin ? (
              <AdminDashboard admin={admin} onLogout={handleLogout} />
            ) : (
              <Navigate to="/admin-login" />
            )
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;