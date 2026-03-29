import React from "react";
import { useNavigate } from "react-router-dom";
import "./WelcomePage.css";

function WelcomePage() {
  const navigate = useNavigate();

  return (
    <div className="container">
      
      {/* LEFT SIDE */}
      <div className="left-panel">
        <div className="logo-box">
          <div className="logo-inner">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path
                d="M20 6L9 17L4 12"
                stroke="#7c3aed"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>

        <h1 className="title">Smart Voting System</h1>

        <ul className="features">
          <li>Secure Authentication</li>
          <li>Real-time Results</li>
          <li>Tamper-proof Records</li>
        </ul>
      </div>

      {/* RIGHT SIDE */}
      <div className="right-panel">
        <h2 className="welcome-text">Welcome Back</h2>
        <p className="login-subtext">
          Select your login type to continue
        </p>

        {/* VOTER */}
        <div
          className="login-card"
          onClick={() => navigate("/voter-login")}
        >
          <div className="icon blue">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="8" r="4" stroke="white" strokeWidth="2" />
              <path
                d="M4 20C4 16 8 14 12 14C16 14 20 16 20 20"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <div className="card-text">
            <h3>Voter Login</h3>
            <p>Cast your vote securely</p>
          </div>
          <span className="arrow">›</span>
        </div>

        {/* ADMIN */}
        <div
          className="login-card"
          onClick={() => navigate("/admin-login")}
        >
          <div className="icon green">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 3L20 7V12C20 17 16 20 12 21C8 20 4 17 4 12V7L12 3Z"
                stroke="white"
                strokeWidth="2"
                strokeLinejoin="round"
              />
              <path
                d="M9 12L11 14L15 10"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div className="card-text">
            <h3>Admin Login</h3>
            <p>Manage the voting system</p>
          </div>
          <span className="arrow">›</span>
        </div>
      </div>
    </div>
  );
}

export default WelcomePage;