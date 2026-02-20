import React, { useState } from "react";
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
      role: "admin"
    };
    onLoginSuccess(mockAdminData);
    toast.success("Login successful!");
    navigate('/admin-dashboard');
    setLoading(false);
    return;
  } else {
    setError("Invalid credentials. Access denied.");
    toast.error("Login failed: invalid credentials");
    setLoading(false);
    return;
  }
};


  return (
    <div style={containerStyle}>
      <form style={formStyle} onSubmit={handleSubmit}>
        <h2 style={titleStyle}>Admin Login</h2>
        <input
          type="text"
          placeholder="User ID or Email"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          required
          style={inputStyle}
          disabled={loading}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={inputStyle}
          disabled={loading}
        />
        {error && <div style={errorStyle}>{error}</div>}
        <button 
          type="submit" 
          style={{
            ...submitBtnStyle,
            opacity: loading ? 0.7 : 1,
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
          disabled={loading}
        >
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>
    </div>
  );
}

const containerStyle = {
  minHeight: "100vh",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  fontFamily: "Segoe UI, Tahoma, Geneva, Verdana, sans-serif",
  background: "linear-gradient(120deg, #794bec 0%, #19dded 80%)",
  padding: "1rem",
};

const formStyle = {
  backgroundColor: "rgba(255, 255, 255, 0.1)",
  padding: "2rem",
  borderRadius: "20px",
  boxShadow: "0 12px 64px rgba(100, 130, 255, 0.25)",
  display: "flex",
  flexDirection: "column",
  width: "100%",
  maxWidth: "400px",
};

const titleStyle = {
  color: "#fff",
  fontWeight: "800",
  fontSize: "2rem",
  marginBottom: "1.5rem",
  textAlign: "center",
};

const inputStyle = {
  marginBottom: "16px",
  padding: "12px 14px",
  borderRadius: "12px",
  border: "none",
  fontSize: "1rem",
  outline: "none",
  boxShadow: "0 2px 8px rgba(255, 255, 255, 0.2)",
};

const submitBtnStyle = {
  padding: "14px",
  borderRadius: "12px",
  border: "none",
  background: "linear-gradient(90deg, #22dea7, #1fb980)",
  color: "#fff",
  fontWeight: "700",
  fontSize: "1.1rem",
  cursor: "pointer",
  boxShadow: "0 8px 24px rgba(34, 222, 170, 0.3)",
};

const errorStyle = {
  color: "#ff6251",
  marginBottom: "10px",
  fontWeight: "600",
  textAlign: "center",
};

export default AdminLogin;
