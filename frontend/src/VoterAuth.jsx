import React, { useState, useEffect, useRef } from "react";
import * as faceapi from "face-api.js";
import Webcam from "react-webcam";

function VoterAuthPage() {
  const [activeTab, setActiveTab] = useState("login");

  // Login form state
  const [loginData, setLoginData] = useState({ userId: "", password: "" });
  const [verifiedFaceDescriptor, setVerifiedFaceDescriptor] = useState(null);
  const [monitoringStarted, setMonitoringStarted] = useState(false);
  const [votingDisabled, setVotingDisabled] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [loginSuccess, setLoginSuccess] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [storedDescriptor, setStoredDescriptor] = useState(null);

  // Register form state
  const [registerData, setRegisterData] = useState({
    voterId: "",
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
  const securityRef = useRef(null);
  const violationCountRef = useRef(0);
  const lastBlinkTimeRef = useRef(Date.now());

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
  const sendAlertToBackend = async (type) => {
    try {
      await fetch("http://localhost:8000/api/alert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          message: type,
        }),
      });
    } catch (err) {
      console.error("Failed to send alert:", err);
    }
  };
  const forceLogout = () => {
    alert("🚨 Security violation detected. Logging out.");

    stopUnifiedSecurityMonitor();

    setIsLoggedIn(false);
    setCameraOn(false);
    setStoredDescriptor(null);

    violationCountRef.current = 0;
    lastBlinkTimeRef.current = Date.now();

    setLoginSuccess("");
  };

  const handleViolation = async (type) => {
    if (violationCountRef.current < 2) {
      violationCountRef.current += 1;
      alert(`⚠️ Warning ${violationCountRef.current}/2: ${type}`);
    } else {
      await sendAlertToBackend(type);
      forceLogout();
    }
  };
  const euclideanDistance = (p1, p2) => {
    return Math.sqrt(
      Math.pow(p1.x - p2.x, 2) +
      Math.pow(p1.y - p2.y, 2)
    );
  };

  // Eye Aspect Ratio calculation
  const getEAR = (eye) => {
    const A = euclideanDistance(eye[1], eye[5]);
    const B = euclideanDistance(eye[2], eye[4]);
    const C = euclideanDistance(eye[0], eye[3]);
    return (A + B) / (2.0 * C);
  };
 
  const startUnifiedSecurityMonitor = () => {
  if (securityRef.current) return;

  securityRef.current = setInterval(async () => {
    if (!webcamRef.current || !webcamRef.current.video) return;
    if (!storedDescriptor) return;

    try {
      const detections = await faceapi
        .detectAllFaces(
          webcamRef.current.video,
          new faceapi.TinyFaceDetectorOptions()
        )
        .withFaceLandmarks()
        .withFaceDescriptors();

      // MULTI FACE CHECK
      if (detections.length !== 1) {
        handleViolation("MULTI_FACE_DETECTED");
        return;
      }

      const detection = detections[0];
      const landmarks = detection.landmarks.positions;
      const liveDescriptor = detection.descriptor;

      // LIVENESS CHECK
      const leftEye = landmarks.slice(36, 42);
      const rightEye = landmarks.slice(42, 48);

      const leftEAR = getEAR(leftEye);
      const rightEAR = getEAR(rightEye);
      const EAR_THRESHOLD = 0.25;

      if (leftEAR < EAR_THRESHOLD && rightEAR < EAR_THRESHOLD) {
        lastBlinkTimeRef.current = Date.now();
      }

      const secondsSinceBlink =
        (Date.now() - lastBlinkTimeRef.current) / 1000;

      if (secondsSinceBlink > 10) {
        handleViolation("LIVENESS_FAILED");
        return;
      }

      // FACE VERIFICATION
      const distance = faceapi.euclideanDistance(
        liveDescriptor,
        storedDescriptor
      );

      if (distance > 0.5) {
        handleViolation("FACE_MISMATCH");
        return;
      }

      // All checks passed
      violationCountRef.current = 0;

    } catch (err) {
      console.error("Security monitor error:", err);
    }
  }, 3000);
};

const stopUnifiedSecurityMonitor = () => {
  if (securityRef.current) {
    clearInterval(securityRef.current);
    securityRef.current = null;
  }
};

  const handleSubmitLogin = async (e) => {
    e.preventDefault();
    setLoginError("");
    setLoginSuccess("");


    try {
      const response = await fetch("http://localhost:8000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          voterId: loginData.userId,
          password: loginData.password,
          loginDescriptor: storedDescriptor
        }),
      });

      const data = await response.json();

      if (response.ok) {

        if (!data.user.match) {
          setLoginError("Face does not match");
          return;
        }

        setLoginSuccess("Login successful!");
        setIsLoggedIn(true);
        setCameraOn(true);

        lastBlinkTimeRef.current = Date.now();
        violationCountRef.current = 0;
      }
      else {
        setLoginError(data.error || "Login failed");
      }
    } catch (error) {
      console.error("Login error:", error);
      setLoginError("Network error. Please try again.");
    }
  };

  useEffect(() => {
    if (isLoggedIn && cameraOn && storedDescriptor) {
      startUnifiedSecurityMonitor();
    }

    return () => {
      stopUnifiedSecurityMonitor();
    };
  }, [isLoggedIn, cameraOn, storedDescriptor]);

  const handleSubmitRegister = async (e) => {
    e.preventDefault();
    setRegisterError("");
    setRegisterSuccess("");

   
    const phoneRegex = /^\d{10}$/;
    const password = registerData.password;
    const uppercaseRegex = /[A-Z]/;
    const symbolRegex = /[!@#$%^&*(),.?":{}|<>]/;
    const voterIdRegex = /^[A-Z]{3}[0-9]{7}$/;

    if (!voterIdRegex.test(registerData.voterId)) {
      setRegisterError("Voter ID must follow format ABC1234567");
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
          voterId: registerData.voterId,
          name: registerData.name,
          phone: registerData.phone,
          email: registerData.email,
          password: registerData.password,
          faceDescriptor
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setRegisterSuccess("✅ Registration successful! You may now log in.");
        setRegisterData({
          voterId: "",
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
        .detectSingleFace(
          webcamRef.current.video,
          new faceapi.TinyFaceDetectorOptions())
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
    <div style={{ maxWidth: "500px", margin: "3rem auto" }}>
      {cameraOn && (
        <Webcam
          audio={false}
          ref={webcamRef}
          screenshotFormat="image/jpeg"
          width="100%"
          videoConstraints={{ facingMode: "user" }}
        />
      )}

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
          <label>User ID (voter ID or Email)</label>
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
          <label>Voter ID</label>
          <input
            type="text"
            name="voterId"
            value={registerData.voterId}
            onChange={handleRegisterChange}
            placeholder="Enter Voter ID (ABC1234567)"
          />
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