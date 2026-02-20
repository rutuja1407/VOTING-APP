import React, { useState, useEffect, useRef } from "react";
import * as faceapi from "face-api.js";
import Webcam from "react-webcam";

function VoterAuthPage() {
  const [activeTab, setActiveTab] = useState("login");

  // Login form state
  const [loginData, setLoginData] = useState({ userId: "", password: "" });
  const [loginError, setLoginError] = useState("");
  const [loginSuccess, setLoginSuccess] = useState("");

  // Register form state
  const [registerData, setRegisterData] = useState({
    aadhaar: "",
    name: "",
    phone: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [registerError, setRegisterError] = useState("");
  const [registerSuccess, setRegisterSuccess] = useState("");

  // Camera state and refs for registration
  const [cameraOn, setCameraOn] = useState(false);
  const [faceDescriptor, setFaceDescriptor] = useState(null);
  const webcamRef = useRef(null);

  // Load face-api models once when component mounts
  useEffect(() => {
    const loadModels = async () => {
      const MODEL_URL = "/models"; // Ensure your face-api models reside here
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
      ]);
    };
    loadModels();
  }, []);

  // Handlers
  const handleLoginChange = (e) =>
    setLoginData({ ...loginData, [e.target.name]: e.target.value });

  const handleRegisterChange = (e) => {
    const { name, value } = e.target;

    if (name === "aadhaar") {
      const digitsOnly = value.replace(/\D/g, "");
      setRegisterData((prev) => ({
        ...prev,
        [name]: digitsOnly.slice(0, 12),
      }));
      return;
    }
    if (name === "phone") {
      const digitsOnly = value.replace(/\D/g, "");
      setRegisterData((prev) => ({
        ...prev,
        [name]: digitsOnly.slice(0, 10),
      }));
      return;
    }
    setRegisterData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmitLogin = async (e) => {
    e.preventDefault();
    setLoginError("");
    setLoginSuccess("");

    try {
      const response = await fetch("http://localhost:8000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(loginData),
      });

      const data = await response.json();

      if (response.ok) {
        setLoginSuccess("Login successful!");
        console.log("User logged in:", data.user);
      } else {
        setLoginError(data.error || "Login failed");
      }
    } catch (error) {
      console.error("Login error:", error);
      setLoginError("Network error. Please try again.");
    }
  };

  const handleSubmitRegister = async (e) => {
    e.preventDefault();
    setRegisterError("");
    setRegisterSuccess("");

    const aadhaarRegex = /^\d{12}$/;
    const phoneRegex = /^\d{10}$/;
    const password = registerData.password;
    const uppercaseRegex = /[A-Z]/;
    const symbolRegex = /[!@#$%^&*(),.?":{}|<>]/;

    if (!aadhaarRegex.test(registerData.aadhaar)) {
      setRegisterError("Aadhaar number must be exactly 12 digits.");
      return;
    }
    if (!phoneRegex.test(registerData.phone)) {
      setRegisterError("Phone number must be exactly 10 digits.");
      return;
    }
    if (password.length < 8) {
      setRegisterError("Password must be at least 8 characters long.");
      return;
    }
    if (!uppercaseRegex.test(password)) {
      setRegisterError("Password must contain at least 1 uppercase letter.");
      return;
    }
    if (!symbolRegex.test(password)) {
      setRegisterError("Password must contain at least 1 symbol.");
      return;
    }
    if (registerData.password !== registerData.confirmPassword) {
      setRegisterError("Passwords do not match!");
      return;
    }
    if (!faceDescriptor) {
      setRegisterError("Please capture your face before registering.");
      return;
    }

    try {
      const response = await fetch("http://localhost:8000/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...registerData,
          faceDescriptor,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setRegisterSuccess("✅ Registration successful! You may now log in.");
        setRegisterData({
          aadhaar: "",
          name: "",
          phone: "",
          email: "",
          password: "",
          confirmPassword: "",
        });
        setFaceDescriptor(null);
        setTimeout(() => setActiveTab("login"), 2000);
      } else {
        setRegisterError(data.error || "Registration failed");
      }
    } catch (error) {
      console.error("Registration error:", error);
      setRegisterError("Network error. Please check if backend server is running.");
    }
  };

  // Camera control handlers
  const handleTurnOnCamera = () => setCameraOn(true);
  const handleTurnOffCamera = () => setCameraOn(false);

  // Capture face embedding with face-api.js
  const captureFace = async () => {
    if (!webcamRef.current) return alert("Camera not ready");

    try {
      const detection = await faceapi
        .detectSingleFace(webcamRef.current.video, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!detection) {
        alert("No face detected. Please try again.");
        return;
      }

      setFaceDescriptor(Array.from(detection.descriptor));
      alert("Face captured successfully!");
    } catch (error) {
      console.error("Face capture error:", error);
      alert("Failed to capture face. Try again.");
    }
  };

  return (
    <div
      style={{
        maxWidth: "500px",
        margin: "3rem auto",
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
        backgroundColor: "#fff7f0",
        padding: "2rem",
        borderRadius: "12px",
        boxShadow: "0 8px 32px rgba(255, 180, 135, 0.15)",
      }}
    >
      {/* Tabs */}
      <div style={{ display: "flex", justifyContent: "center", marginBottom: "1.5rem" }}>
        <button
          style={{
            flex: 1,
            padding: "12px",
            backgroundColor: activeTab === "login" ? "#ffbe9d" : "#fff7f0",
            border: "1px solid #ff8e64",
            color: activeTab === "login" ? "#fff" : "#b27444",
            cursor: "pointer",
            borderRadius: "8px 0 0 8px",
            fontWeight: "600",
          }}
          onClick={() => setActiveTab("login")}
        >
          Login
        </button>
        <button
          style={{
            flex: 1,
            padding: "12px",
            backgroundColor: activeTab === "register" ? "#ffbe9d" : "#fff7f0",
            border: "1px solid #ff8e64",
            color: activeTab === "register" ? "#fff" : "#b27444",
            cursor: "pointer",
            borderRadius: "0 8px 8px 0",
            fontWeight: "600",
          }}
          onClick={() => setActiveTab("register")}
        >
          Register
        </button>
      </div>

      {/* Login Form */}
      {activeTab === "login" && (
        <form onSubmit={handleSubmitLogin}>
          <label>User ID (Aadhaar or Email)</label>
          <input
            type="text"
            name="userId"
            value={loginData.userId}
            onChange={handleLoginChange}
            placeholder="Enter User ID"
            required
            style={inputStyle}
          />
          <label>Password</label>
          <input
            type="password"
            name="password"
            value={loginData.password}
            onChange={handleLoginChange}
            placeholder="Enter Password"
            required
            style={inputStyle}
          />

          {loginError && <div style={errorStyle}>{loginError}</div>}
          {loginSuccess && <div style={successStyle}>{loginSuccess}</div>}
          <button type="submit" style={submitBtnStyle}>
            Login
          </button>
        </form>
      )}

      {/* Register Form */}
      {activeTab === "register" && (
        <form onSubmit={handleSubmitRegister}>
          <label>Aadhaar Number</label>
          <input
            type="text"
            name="aadhaar"
            value={registerData.aadhaar}
            onChange={handleRegisterChange}
            placeholder="Enter Aadhaar Number"
            required
            style={inputStyle}
            maxLength={12}
            pattern="\d*"
            inputMode="numeric"
          />
          <label>Name</label>
          <input
            type="text"
            name="name"
            value={registerData.name}
            onChange={handleRegisterChange}
            placeholder="Enter Full Name"
            required
            style={inputStyle}
          />
          <label>Phone Number</label>
          <input
            type="tel"
            name="phone"
            value={registerData.phone}
            onChange={handleRegisterChange}
            placeholder="Enter Phone Number"
            required
            style={inputStyle}
            maxLength={10}
            pattern="\d*"
            inputMode="numeric"
          />
          <label>Email ID</label>
          <input
            type="email"
            name="email"
            value={registerData.email}
            onChange={handleRegisterChange}
            placeholder="Enter Email"
            required
            style={inputStyle}
          />
          <label>Password</label>
          <input
            type="password"
            name="password"
            value={registerData.password}
            onChange={handleRegisterChange}
            placeholder="Set Password"
            required
            style={inputStyle}
          />
          <label>Confirm Password</label>
          <input
            type="password"
            name="confirmPassword"
            value={registerData.confirmPassword}
            onChange={handleRegisterChange}
            placeholder="Confirm Password"
            required
            style={inputStyle}
          />

          <button
            type="button"
            onClick={() => setCameraOn(!cameraOn)}
            style={cameraBtnStyle}
          >
            {cameraOn ? "Turn Off Camera" : "Turn On Camera"}
          </button>

          {cameraOn && (
            <div>
              <Webcam
                audio={false}
                ref={webcamRef}
                screenshotFormat="image/jpeg"
                width="100%"
                style={{ borderRadius: "12px", marginTop: "12px" }}
                videoConstraints={{ facingMode: "user" }}
              />
              <button
                type="button"
                onClick={captureFace}
                style={{ ...captureBtnStyle, marginTop: "10px" }}
              >
                Capture Face
              </button>
            </div>
          )}

          {registerError && <div style={errorStyle}>{registerError}</div>}
          {registerSuccess && <div style={successStyle}>{registerSuccess}</div>}
          <button type="submit" style={submitBtnStyle}>
            Register
          </button>
        </form>
      )}
    </div>
  );
}

const inputStyle = {
  width: "100%",
  padding: "10px 14px",
  margin: "6px 0 12px 0",
  borderRadius: "8px",
  border: "1px solid #ffd6c1",
  fontSize: "1rem",
};

const submitBtnStyle = {
  width: "100%",
  padding: "14px",
  borderRadius: "8px",
  border: "none",
  backgroundColor: "#ff8e64",
  color: "#fff",
  fontWeight: "700",
  fontSize: "1.1rem",
  cursor: "pointer",
  boxShadow: "0 4px 15px rgba(255, 142, 100, 0.5)",
};

const errorStyle = {
  color: "#d94343",
  fontWeight: "600",
  marginBottom: "10px",
};

const successStyle = {
  color: "#44b86b",
  fontWeight: "600",
  marginBottom: "10px",
};

const cameraBtnStyle = {
  marginTop: "10px",
  width: "100%",
  padding: "14px",
  borderRadius: "8px",
  border: "none",
  backgroundColor: "#ff8a5c",
  color: "#fff",
  fontWeight: "700",
  fontSize: "1.1rem",
  cursor: "pointer",
  boxShadow: "0 4px 15px rgba(255, 138, 92, 0.5)",
};

const captureBtnStyle = {
  marginTop: "0.5rem",
  width: "100%",
  padding: "12px",
  borderRadius: "8px",
  border: "none",
  backgroundColor: "#4caf50",
  color: "#fff",
  fontWeight: "600",
  fontSize: "1.1rem",
  cursor: "pointer",
};

export default VoterAuthPage;