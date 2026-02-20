import React, { useState } from "react";
import "./style.css"; // Your CSS file
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import WelcomePage from "./WelcomePage";
import VoterLogin from "./VoterLogin";
import AdminLogin from "./AdminLogin";
import CandidateManager from "./CandidateManager";
import AdminDashboard from "./AdminDashboard";  
import VoterDashboard from "./VoterDashboard";
import { Toaster } from "sonner";
import { UserProvider } from "./contexts/user.context";

function App() {
  const [admin, setAdmin] = useState(null);

  const handleAdminLoginSuccess = (adminData) => {
    setAdmin(adminData);
  };

  const handleLogout = () => {
    setAdmin(null);
  };

  return (
    <UserProvider>
       <BrowserRouter>
      {/* ✅ Toaster must be inside BrowserRouter but outside Routes */}
      <Toaster richColors position="top-right" />

      <Routes>
        <Route path="/" element={<WelcomePage />} />       

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

        <Route path="/voter-login" element={<VoterLogin />} />
        <Route path="/voter-dashboard" element={<VoterDashboard />} />

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
          path="/candidate-manager"
          element={
            admin ? (
              <CandidateManager admin={admin} onLogout={handleLogout} />
            ) : (
              <Navigate to="/admin-login" />
            )
          }
        />
      </Routes>
    </BrowserRouter>
    </UserProvider>
   
  );
}

export default App;
