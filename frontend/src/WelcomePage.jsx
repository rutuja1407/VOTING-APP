import React from "react";
import { useNavigate } from "react-router-dom";
import "./WelcomePage.css";

function WelcomePage() {
  const navigate = useNavigate();

  return (
    <div className="welcome-bg">
      <div className="welcome-main">
        {/* Branding Section */}
        <div className="brand-block">
          <div className="brand-icon">
            {/* SVG icon */}
            <svg width="72" height="72">
              <rect width="72" height="72" rx="18" fill="#6944EC" />
              <polyline points="24,40 36,52 54,22" stroke="#fff" strokeWidth="6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h1 className="brand-title">
            <span className="brand-gradient">DigiVote</span>
          </h1>
          <p className="brand-sub">Online Voting System</p>
          <p className="brand-sub2">with Facial Detection</p>
        </div>
        {/* Login Options */}
        <div className="login-block">
          <div className="login-card">
            <div className="login-icon">
              {/* Voter SVG */}
              <svg width="44" height="44">
                <rect width="44" height="44" rx="11" fill="#23A8F2"/>
                <circle cx="22" cy="18" r="7" stroke="#fff" strokeWidth="3" fill="none"/>
                <rect x="13" y="33" width="18" height="4" rx="2" fill="#fff"/>
              </svg>
            </div>
            <h2>Voter Login</h2>
            {/* FIXED: Correct navigation route */}
            <button className="voter-btn" onClick={() => navigate("/voter-login")}>
              Login as Voter
            </button>
          </div>
          <div className="login-card">
            <div className="login-icon">
              {/* Admin SVG */}
              <svg width="44" height="44">
                <rect width="44" height="44" rx="11" fill="#27e5a3"/>
                <path d="M22 13l11 6v9c0 5.5-5.5 10-11 10s-11-4.5-11-10v-9l11-6z" stroke="#fff" strokeWidth="3" fill="none"/>
              </svg>
            </div>
            <h2>Admin Login</h2>
            <button className="admin-btn" onClick={() => navigate("/admin-login")}>
              Login as Admin
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default WelcomePage;
