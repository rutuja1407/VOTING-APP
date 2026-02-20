import { useState, useRef, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import * as faceapi from "face-api.js";
import "./LoginPage.css";
import { toast } from "sonner";
import { useUser } from './contexts/user.context';
import { FiEye, FiEyeOff } from 'react-icons/fi';

function VoterLogin() {
  const [activeTab, setActiveTab] = useState("login");
  const navigate = useNavigate();
  const {setUser} = useUser();
  
  // Login form state
  const [loginData, setLoginData] = useState({ userId: "", password: "" });
  const [loginError, setLoginError] = useState("");
  const [loginCameraOn, setLoginCameraOn] = useState(false);
  const [loginDescriptor, setLoginDescriptor] = useState(null);
  const [showLoginPassword, setShowLoginPassword] = useState(false);

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
  const [registerCameraOn, setRegisterCameraOn] = useState(false);
  const [faceDescriptor, setFaceDescriptor] = useState(null);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [showRegisterConfirmPassword, setShowRegisterConfirmPassword] = useState(false);

  // Webcam refs and streams
  const loginVideoRef = useRef(null);
  const loginStreamRef = useRef(null);
  const registerVideoRef = useRef(null);
  const registerStreamRef = useRef(null);

  // Load face-api.js models once on mount
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [modelsLoading, setModelsLoading] = useState(true);

  useEffect(() => {
    const loadModels = async () => {
      try {
        const MODEL_URL = '/models';
        toast.loading("Loading face detection models...", { id: 'models-loading' });
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
        ]);
        setModelsLoaded(true);
        toast.success("Face detection ready!", { id: 'models-loading' });
      } catch (error) {
        console.error("Model loading error:", error);
        toast.error("Failed to load face detection models", { id: 'models-loading' });
      } finally {
        setModelsLoading(false);
      }
    };
    loadModels();
  }, []);

  // Set stream to video element when both are ready (login)
  useEffect(() => {
    if (loginCameraOn && loginStreamRef.current && loginVideoRef.current) {
      loginVideoRef.current.srcObject = loginStreamRef.current;
    }
  }, [loginCameraOn]);

  // Set stream to video element when both are ready (register)
  useEffect(() => {
    if (registerCameraOn && registerStreamRef.current && registerVideoRef.current) {
      registerVideoRef.current.srcObject = registerStreamRef.current;
    }
  }, [registerCameraOn]);

  // Camera toggle handlers
  const toggleLoginCamera = async () => {
    if (!modelsLoaded) {
      toast.error("Face detection models are still loading, please wait.");
      return;
    }
    if (loginCameraOn) {
      loginStreamRef.current?.getTracks().forEach(track => track.stop());
      loginStreamRef.current = null;
      setLoginCameraOn(false);
      setLoginDescriptor(null);
      toast.info("Camera turned off");
    } else {
      try {
        toast.loading("Starting camera...", { id: 'login-camera' });
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        loginStreamRef.current = stream;
        setLoginCameraOn(true);
        toast.success("Camera ready!", { id: 'login-camera' });
      } catch(error) {
        console.error('Camera error:', error);
        toast.error("Unable to access camera. Please allow permissions.", { id: 'login-camera' });
      }
    }
  };

  const toggleRegisterCamera = async () => {
    if (!modelsLoaded) {
      toast.error("Face detection models are still loading, please wait.");
      return;
    }
    if (registerCameraOn) {
      registerStreamRef.current?.getTracks().forEach(track => track.stop());
      registerStreamRef.current = null;
      setRegisterCameraOn(false);
      setFaceDescriptor(null);
      toast.info("Camera turned off");
    } else {
      try {
        toast.loading("Starting camera...", { id: 'register-camera' });
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        registerStreamRef.current = stream;
        setRegisterCameraOn(true);
        toast.success("Camera ready!", { id: 'register-camera' });
      } catch (error) {
        console.error("Camera access error:", error);
        toast.error("Unable to access camera. Please allow permissions.", { id: 'register-camera' });
      }
    }
  };

  // Capture face descriptor for registration
  const captureRegisterFace = async () => {
    if (!registerVideoRef.current) {
      toast.error("Camera not ready");
      return;
    }
    if (!modelsLoaded) {
      toast.error("Face detection models not ready");
      return;
    }
    
    const video = registerVideoRef.current;
    try {
      toast.loading("Detecting face...", { id: 'register-face-capture' });
      const detection = await faceapi
        .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptor();
      
      if (!detection) {
        toast.error("No face detected. Please ensure your face is clearly visible and try again.", { id: 'register-face-capture' });
        return;
      }
      
      setFaceDescriptor(Array.from(detection.descriptor));
      toast.success("Face captured successfully for signup!", { id: 'register-face-capture' });
    } catch (error) {
      console.error("Face capture error:", error);
      toast.error("Failed to capture face. Please try again.", { id: 'register-face-capture' });
    }
  };

  // Capture face descriptor for login
  const captureLoginFace = async () => {
    if (!loginVideoRef.current) {
      toast.error("Camera not ready");
      return;
    }
    if (!modelsLoaded) {
      toast.error("Face detection models not ready");
      return;
    }
    
    const video = loginVideoRef.current;
    try {
      toast.loading("Detecting face...", { id: 'login-face-capture' });
      const detection = await faceapi
        .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptor();
      
      if (!detection) {
        toast.error("No face detected. Please ensure your face is clearly visible and try again.", { id: 'login-face-capture' });
        return;
      }
      
      setLoginDescriptor(Array.from(detection.descriptor));
      toast.success("Face captured successfully for login!", { id: 'login-face-capture' });
    } catch (error) {
      console.error("Face capture error:", error);
      toast.error("Failed to capture face. Please try again.", { id: 'login-face-capture' });
    }
  };

  // Input handlers
  const handleLoginChange = (e) => {
    const { name, value } = e.target;
    if (name === "userId") {
      if (/^\d*$/.test(value)) {
        setLoginData((prev) => ({ ...prev, [name]: value.slice(0, 12) }));
      } else {
        setLoginData((prev) => ({ ...prev, [name]: value }));
      }
      return;
    }
    setLoginData((prev) => ({ ...prev, [name]: value }));
  };

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
    setRegisterData((prev) => ({ ...prev, [name]: value }));
  };

  // Submit handlers
  const handleSubmitLogin = async (e) => {
    e.preventDefault();
    if (!loginDescriptor) {
      setLoginError("Please capture your face to login.");
      toast.error("Please capture your face to login.");
      return;
    }
    try {
      toast.loading("Logging in...", { id: 'login-submit' });
      const res = await fetch("http://localhost:8000/api/auth/login", {
        method: "POST",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: loginData.userId,
          password: loginData.password,
          loginDescriptor: loginDescriptor, 
        }),
      });
      const data = await res.json();
      if (res.status === 200 && data.user.match) {
        localStorage.setItem('aadhaar', data.user.aadhaar);
        toast.success("Login successful!", { id: 'login-submit' });
        setUser(data.user || {});
        navigate('/voter-dashboard');
      } else {  
        if(data.user && !data.user.match) {
          toast.error("Face does not match. Please try again.", { id: 'login-submit' });
          return;
        }
        toast.error(data.error || "Unexpected error during login.", { id: 'login-submit' });
      } 
    } catch (error) {
      console.error("Login error:", error);
      toast.error(error.message || "Network error. Please try again.", { id: 'login-submit' });
    } finally{
      setLoginDescriptor(null);
      setLoginData({ userId: "", password: "" });
      setLoginCameraOn(false);
      loginStreamRef.current?.getTracks().forEach(track => track.stop());
      loginStreamRef.current = null;
    }
  };

  const handleSubmitRegister = async (e) => {
    e.preventDefault();

    const aadhaarRegex = /^\d{12}$/;
    const phoneRegex = /^\d{10}$/;
    const password = registerData.password;
    const uppercaseRegex = /[A-Z]/;
    const symbolRegex = /[!@#$%^&*(),.?":{}|<>]/;

    if (!aadhaarRegex.test(registerData.aadhaar)) {
      setRegisterError("Aadhaar number must be exactly 12 digits.");
      toast.error("Aadhaar number must be exactly 12 digits.");
      return;
    }
    if (!phoneRegex.test(registerData.phone)) {
      setRegisterError("Phone number must be exactly 10 digits.");
      toast.error("Phone number must be exactly 10 digits.");
      return;
    }
    if (password.length < 8) {
      setRegisterError("Password must be at least 8 characters long.");
      toast.error("Password must be at least 8 characters long.");
      return;
    }
    if (!uppercaseRegex.test(password)) {
      setRegisterError("Password must contain at least 1 uppercase letter.");
      toast.error("Password must contain at least 1 uppercase letter.");
      return;
    }
    if (!symbolRegex.test(password)) {
      setRegisterError("Password must contain at least 1 symbol.");
      toast.error("Password must contain at least 1 symbol.");
      return;
    }
    if (registerData.password !== registerData.confirmPassword) {
      setRegisterError("Passwords do not match!");
      toast.error("Passwords do not match!");
      return;
    }
    if (!faceDescriptor) {
      setRegisterError("Please capture your face before registering.");
      toast.error("Please capture your face before registering.");
      return;
    }

    try {
      toast.loading("Registering...", { id: 'register-submit' });
      const res = await fetch("http://localhost:8000/api/auth/register", {
        method: "POST",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          aadhaar: registerData.aadhaar,
          name: registerData.name,
          phone: registerData.phone,
          email: registerData.email,
          password: registerData.password,
          faceDescriptor: faceDescriptor,
        }),
      });

      const data = await res.json();
      if (res.status === 201) {
        toast.success("Signup successful! You can now login.", { id: 'register-submit' });
        setFaceDescriptor(null);
        setRegisterData({
          aadhaar: "",
          name: "",
          phone: "",
          email: "",
          password: "",
          confirmPassword: "",
        });
        setRegisterError("");
        setRegisterCameraOn(false);
        registerStreamRef.current?.getTracks().forEach(track => track.stop());
        registerStreamRef.current = null;
        setActiveTab("login");
      } else {
        toast.error(data.error || "Registration failed", { id: 'register-submit' });
        setRegisterError(data.error || "Registration failed");
      }
    } catch (err) {
      console.error("Error registering:", err);
      toast.error("Network error. Please try again.", { id: 'register-submit' });
      setRegisterError("Network error. Please try again.");
    }
  };

  return (
    <div className="login-bg">
      <div className="login-card-theme">
        <div className="login-icon-theme voter-theme">
          {/* Voter icon */}
          <svg width="44" height="44">
            <rect width="44" height="44" rx="11" fill="#23A8F2" />
            <circle cx="22" cy="18" r="7" stroke="#fff" strokeWidth="3" fill="none" />
            <rect x="13" y="33" width="18" height="4" rx="2" fill="#fff" />
          </svg>
        </div>
        <h2 className="login-title-theme">
          Voter {activeTab === "login" ? "Login" : "Register"}
        </h2>

        {/* Tabs */}
        <div className="login-tabs">
          <button
            className={activeTab === "login" ? "tab active" : "tab"}
            onClick={() => setActiveTab("login")}
          >
            Login
          </button>
          <button
            className={activeTab === "register" ? "tab active" : "tab"}
            onClick={() => setActiveTab("register")}
          >
            Register
          </button>
        </div>

        {/* Login Form */}
        {activeTab === "login" && (
          <form onSubmit={handleSubmitLogin} className="login-form-theme">
            <input
              type="text"
              name="userId"
              placeholder="Aadhaar or Email"
              value={loginData.userId}
              onChange={handleLoginChange}
              className="login-input-theme"
              required
            />
            
            {/* Password field with eye icon */}
            <div style={{ position: 'relative', width: '100%' }}>
              <input
                type={showLoginPassword ? "text" : "password"}
                name="password"
                placeholder="Password"
                value={loginData.password}
                onChange={handleLoginChange}
                className="login-input-theme"
                required
              />
              <button
                type="button"
                onClick={() => setShowLoginPassword(!showLoginPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#818398',
                  transition: 'color 0.2s ease',
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = '#6a5ae0'}
                onMouseLeave={(e) => e.currentTarget.style.color = '#818398'}
                aria-label={showLoginPassword ? "Hide password" : "Show password"}
              >
                {showLoginPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
              </button>
            </div>

            <button
              type="button"
              onClick={toggleLoginCamera}
              className="camera-btn"
              style={{ marginTop: "12px" }}
              disabled={modelsLoading}
            >
              {modelsLoading ? "Loading..." : loginCameraOn ? "Turn Off Camera" : "Turn On Camera"}
            </button>

            {loginCameraOn && (
              <div style={{ position: "relative", width: "100%", marginTop: "12px" }}>
                <video
                  ref={loginVideoRef}
                  autoPlay
                  muted
                  playsInline
                  width="100%"
                  style={{ borderRadius: "12px" }}
                />
                <button
                  type="button"
                  onClick={captureLoginFace}
                  disabled={!loginCameraOn || !modelsLoaded}
                  style={{
                    position: "absolute",
                    bottom: "12px",
                    left: "50%",
                    transform: "translateX(-50%)",
                    width: "60px",
                    height: "60px",
                    borderRadius: "50%",
                    border: "none",
                    backgroundImage: loginDescriptor 
                      ? "linear-gradient(90deg, #4CAF50 0%, #45a049 100%)" 
                      : "linear-gradient(90deg, #23a8f2 0%, #1de9b6 100%)",
                    color: "#fff",
                    fontWeight: "700",
                    fontSize: "1.6rem",
                    cursor: "pointer",
                    boxShadow: "0 4px 18px rgba(30,233,182,0.15)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    userSelect: "none",
                    transition: "all 0.3s ease",
                  }}
                  aria-label="Capture Face"
                >
                  {loginDescriptor ? "✓" : "📸"}
                </button>
              </div>
            )}

            {loginError && <div className="login-error-theme">{loginError}</div>}

            <button
              type="submit"
              className="login-btn-theme voter-btn-theme"
              style={{ marginTop: "12px" }}
              disabled={!loginDescriptor}
            >
              Login
            </button>
          </form>
        )}

        {/* Register Form */}
        {activeTab === "register" && (
          <form onSubmit={handleSubmitRegister} className="login-form-theme">
            <input
              type="text"
              name="aadhaar"
              placeholder="Aadhaar (12 digits)"
              value={registerData.aadhaar}
              onChange={handleRegisterChange}
              className="login-input-theme"
              required
            />
            <input
              type="text"
              name="name"
              placeholder="Full Name"
              value={registerData.name}
              onChange={handleRegisterChange}
              className="login-input-theme"
              required
            />
            <input
              type="text"
              name="phone"
              placeholder="Phone (10 digits)"
              value={registerData.phone}
              onChange={handleRegisterChange}
              className="login-input-theme"
              required
            />
            <input
              type="email"
              name="email"
              placeholder="Email Address"
              value={registerData.email}
              onChange={handleRegisterChange}
              className="login-input-theme"
              required
            />
            
            {/* Password field with eye icon */}
            <div style={{ position: 'relative', width: '100%' }}>
              <input
                type={showRegisterPassword ? "text" : "password"}
                name="password"
                placeholder="Password"
                value={registerData.password}
                onChange={handleRegisterChange}
                className="login-input-theme"
                required
              />
              <button
                type="button"
                onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#818398',
                  transition: 'color 0.2s ease',
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = '#6a5ae0'}
                onMouseLeave={(e) => e.currentTarget.style.color = '#818398'}
                aria-label={showRegisterPassword ? "Hide password" : "Show password"}
              >
                {showRegisterPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
              </button>
            </div>

            {/* Confirm Password field with eye icon */}
            <div style={{ position: 'relative', width: '100%' }}>
              <input
                type={showRegisterConfirmPassword ? "text" : "password"}
                name="confirmPassword"
                placeholder="Confirm Password"
                value={registerData.confirmPassword}
                onChange={handleRegisterChange}
                className="login-input-theme"
                required
              />
              <button
                type="button"
                onClick={() => setShowRegisterConfirmPassword(!showRegisterConfirmPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#818398',
                  transition: 'color 0.2s ease',
                }}
                
              >
                {showRegisterConfirmPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
              </button>
            </div>

            <button
              type="button"
              onClick={toggleRegisterCamera}
              className="camera-btn"
              style={{ marginTop: "12px" }}
              disabled={modelsLoading}
            >
              {modelsLoading ? "Loading..." : registerCameraOn ? "Turn Off Camera" : "Turn On Camera"}
            </button>

            {registerCameraOn && (
              <div style={{ position: "relative", width: "100%", marginTop: "12px" }}>
                <video
                  ref={registerVideoRef}
                  autoPlay
                  muted
                  playsInline
                  width="100%"
                  style={{ borderRadius: "12px" }}
                />
                <button
                  type="button"
                  onClick={captureRegisterFace}
                  disabled={!registerCameraOn || !modelsLoaded}
                  style={{
                    position: "absolute",
                    bottom: "12px",
                    left: "50%",
                    transform: "translateX(-50%)",
                    width: "60px",
                    height: "60px",
                    borderRadius: "50%",
                    border: "none",
                    backgroundImage: faceDescriptor 
                      ? "linear-gradient(90deg, #4CAF50 0%, #45a049 100%)" 
                      : "linear-gradient(90deg, #23a8f2 0%, #1de9b6 100%)",
                    color: "#fff",
                    fontWeight: "700",
                    fontSize: "1.6rem",
                    cursor: "pointer",
                    boxShadow: "0 4px 18px rgba(30,233,182,0.15)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    userSelect: "none",
                    transition: "all 0.3s ease",
                  }}
                  aria-label="Capture Face"
                >
                  {faceDescriptor ? "✓" : "📸"}
                </button>
              </div>
            )}

            {registerError && (
              <div className="login-error-theme">{registerError}</div>
            )}

            <button
              type="submit"
              className="login-btn-theme voter-btn-theme"
              style={{ marginTop: "12px" }}
              disabled={!faceDescriptor}
            >
              Register
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default VoterLogin;
