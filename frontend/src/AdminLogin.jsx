import React, { useState } from "react";

import "./AdminLogin.css";

import { useNavigate } from "react-router-dom";

import { toast } from "sonner";

function AdminLogin({ onLoginSuccess }) {
  const [userId, setUserId] = useState("");

  const [password, setPassword] = useState("");

  const [error, setError] = useState("");

  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");

    setLoading(true);

    // Simple validation

    if (!userId || !password) {
      setError("Please enter both User ID and Password");

      setLoading(false);

      return;
    }


  // Only allow hardcoded admin credentials
  if (userId === "admin1@domain.com" && password === "Admin123") {
    const mockAdminData = {
      id: "admin_001",
      userId: userId,
      name: "Administrator",
      email: "admin1@domain.com",
      role: "admin",
    };
    
    onLoginSuccess(mockAdminData);
    toast.success("Login successful!");
    navigate("/admin-dashboard");
    setLoading(false);
    return;
  } else {
    setError("Invalid credentials. Access denied.");
    toast.error("Login failed: invalid credentials");
    setLoading(false);
    return;
  }
  }
  return (
    <div className="admin-container">
      {/* LEFT SIDE */}

      <div className="admin-left">
        <h1>Smart Voting System</h1>

        <ul>
          <li>Secure Authentication</li>

          <li>Real-time Results</li>

          <li>Tamper-proof Records</li>
        </ul>
      </div>

      {/* RIGHT SIDE */}

      <div className="admin-right">
        <form className="admin-card" onSubmit={handleSubmit}>
          <img
            src="https://static.vecteezy.com/system/resources/thumbnails/005/005/791/small/user-icon-in-trendy-flat-style-isolated-on-grey-background-user-symbol-for-your-web-site-design-logo-app-ui-illustration-eps10-free-vector.jpg"
            alt=""
            width={50}
            height={50}
          />

          <h2 className="admin-title">Admin Login</h2>

          <input
            type="text"
            placeholder="User ID or Email"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            required
            className="admin-input"
            disabled={loading}
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="admin-input"
            disabled={loading}
          />

          {error && <div className="admin-error">{error}</div>}

          <button
            type="submit"
            className="admin-btn"
            disabled={loading}
            style={{
              opacity: loading ? 0.7 : 1,

              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default AdminLogin;
