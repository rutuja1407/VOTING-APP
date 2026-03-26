import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import * as faceapi from "face-api.js";
import "./VoterDashboard.css";
import { toast } from "sonner";
import { useUser } from "./contexts/user.context";

function VoterDashboard() {
  const navigate = useNavigate();
  const { user, setUser } = useUser();

  const [showRulesModal, setShowRulesModal] = useState(true);
  const [showVotingConfirmation, setShowVotingConfirmation] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [activeTab, setActiveTab] = useState("candidates");
  const [expandedCards, setExpandedCards] = useState({});
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [candidates, setCandidates] = useState([]);
  const [modelsLoaded, setModelsLoaded] = useState(false);

  const violationCountRef = useRef(0);
  const lastFaceBoxRef = useRef(null);
  const stableFaceRef = useRef(null);
  const videoRef = useRef(null);
  const videoDisplayRef = useRef(null);
  const streamRef = useRef(null);
  const monitorRef = useRef(null);
  const modelsLoadedRef = useRef(false);

  // Stable ref so monitoring interval never has a stale closure
  const detectorOptionsRef = useRef(
    new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.4 })
  );

  // ─── Monitoring ────────────────────────────────────────────────────────────

  const stopMonitoring = () => {
    if (monitorRef.current) {
      clearInterval(monitorRef.current);
      monitorRef.current = null;
    }
  };

  const forceLogout = (reason) => {
    stopMonitoring(); // ✅ stop interval FIRST before anything else
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    localStorage.clear();
    window.location.href = "/";
    toast.error("Logged out due to suspicious activity ");
  };

  const startContinuousMonitoring = () => {
    if (monitorRef.current) return;

    monitorRef.current = setInterval(async () => {
      if (!modelsLoadedRef.current) return;

      const video = videoRef.current;

      if (
        !video.srcObject ||
        video.srcObject.getTracks().some((t) => t.readyState !== "live")
      ) {
        return "Camera turned off";
      }

      if (video.readyState < 2) return;

      try {
        const detection = await faceapi
          .detectSingleFace(video, detectorOptionsRef.current)
          .withFaceLandmarks()
          .withFaceDescriptor();

        const violation = await evaluateDetectionStable(detection);

        if (violation) {
          violationCountRef.current++;

          // ✅ Only logout after consistent violations
          if (violationCountRef.current >= 3) {
            forceLogout(violation);
          }
        } else {
          // ✅ Reset if stable
          violationCountRef.current = 0;
        }
      } catch (err) {
        console.error("Monitoring error:", err);
      }
    }, 500); // ✅ faster loop
  };

  const evaluateDetectionStable = async (detection) => {
    // ❌ No face
    if (!detection) return "No face detected";

    const box = detection.detection.box;

    // ✅ First frame → store reference
    if (!stableFaceRef.current) {
      stableFaceRef.current = detection.descriptor;
      lastFaceBoxRef.current = box;
      return null;
    }

    // ─── FACE MATCH CHECK ───
    const distance = faceapi.euclideanDistance(
      stableFaceRef.current,
      detection.descriptor
    );

    if (distance > 0.6) {
      return "Different person detected";
    }

    // ─── MOVEMENT CHECK (ANTI-SPOOF / HAND WAVING) ───
    const lastBox = lastFaceBoxRef.current;

    if (lastBox) {
      const dx = Math.abs(box.x - lastBox.x);
      const dy = Math.abs(box.y - lastBox.y);

      if (dx > 80 || dy > 80) {
        return "Suspicious movement detected";
      }
    }

    lastFaceBoxRef.current = box;

    // ─── MANUAL PHONE DETECTION (NO ML MODEL) ───
    const phoneDetected = detectPhoneHeuristic(detection);

    if (phoneDetected) {
      return "Mobile phone detected";
    }

    return null;
  };

  const captureReferenceFace = async () => {
    if (!videoRef.current || !modelsLoadedRef.current) return;

    for (let attempt = 1; attempt <= 5; attempt++) {
      try {
        const detection = await faceapi
          .detectSingleFace(videoRef.current, detectorOptionsRef.current)
          .withFaceLandmarks()
          .withFaceDescriptor();

        if (detection) {
          toast.success("Face verified. Monitoring started.");
          startContinuousMonitoring();
          return;
        }
      } catch (err) {
        console.error(`Face capture attempt ${attempt} failed:`, err);
      }
      await new Promise((r) => setTimeout(r, 800));
    }

    toast.error("Face not detected. Sit closer with good lighting.");
  };
  const detectPhoneHeuristic = (detection) => {
    const landmarks = detection.landmarks;

    if (!landmarks) return false;

    const jaw = landmarks.getJawOutline();
    const nose = landmarks.getNose();

    if (!jaw || !nose) return false;

    // Approx face width
    const faceWidth = Math.abs(jaw[16].x - jaw[0].x);

    // If something is too close to face edges → likely phone
    const leftSide = jaw[0].x;
    const rightSide = jaw[16].x;

    // Heuristic: sudden occlusion / edge disturbance
    const faceBox = detection.detection.box;

    if (
      faceBox.width < 80 || // face partially blocked
      faceBox.height < 80
    ) {
      return true;
    }

    return false;
  };
  // ─── Voting ─────────────────────────────────────────────────────────────────

  const handleVote = (candidateId) => {
    const candidate = candidates.find((c) => c.id === candidateId);
    if (candidate) {
      setSelectedCandidate(candidate);
      setShowVotingConfirmation(true);
    }
  };

  const confirmVote = async () => {
    if (!selectedCandidate) return;
    setShowVotingConfirmation(false);

    try {
      const res = await fetch("http://localhost:8000/api/vote/", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          voterId: localStorage.getItem("voterId"),
          position: selectedCandidate.position,
          candidateId: selectedCandidate._id,
        }),
      });

      const data = await res.json();

      if (res.status === 200) {
        toast.success(`Vote cast for ${selectedCandidate.name}!`);
        setUser((prev) => ({ ...prev, hasVoted: true }));
      } else {
        toast.error(data.error || "Failed to cast vote");
      }
    } catch {
      toast.error("Failed to cast vote");
    } finally {
      setSelectedCandidate(null);
    }
  };

  const handleLogout = () => {
    toast.success("Logged out successfully");
    setUser({});
    localStorage.removeItem("voterId");
    navigate("/", { replace: true });
  };

  // ─── Effects ─────────────────────────────────────────────────────────────────

  // Fetch candidates once
  useEffect(() => {
    fetch("http://localhost:8000/api/candidates")
      .then((r) => r.json())
      .then((data) => setCandidates(data.candidates ?? []))
      .catch(() => toast.error("Failed to fetch candidates"));
  }, []);

  // Load face-api models once
  useEffect(() => {
    const MODEL_URL = "/models";
    toast.loading("Loading face detection models...", { id: "models" });

    Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
      faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
      faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
    ])
      .then(() => {
        setModelsLoaded(true);
        modelsLoadedRef.current = true;
        toast.success("Face detection ready!", { id: "models" });
      })
      .catch(() =>
        toast.error("Failed to load face detection models", { id: "models" })
      );
  }, []);

  // Start camera — stream only, no monitoring yet
  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then((stream) => {
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => videoRef.current.play();
        }
      })
      .catch(() => forceLogout("Camera access denied"));

    return () => stopMonitoring();
  }, []);

  // Once models are ready, wait for video to stabilize then capture face
  useEffect(() => {
    if (!modelsLoaded) return;
    const timer = setTimeout(captureReferenceFace, 1500);
    return () => clearTimeout(timer);
  }, [modelsLoaded]);

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="voter-dashboard">
      {/* Self-view pip — fixed top-right like Google/Zoom Meet */}
      <div
        ref={videoDisplayRef}
        style={{
          position: "fixed",
          top: "16px",
          right: "16px",
          width: "160px",
          height: "160px",
          borderRadius: "12px",
          overflow: "hidden",
          boxShadow: "0 4px 16px rgba(0,0,0,0.3)",
          border: "2px solid #3b82f6",
          zIndex: 9999,
          backgroundColor: "#1f2937",
        }}
      >
        <video
          ref={videoRef}
          autoPlay
          muted
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            transform: "scaleX(-1)",
            display: "block",
          }}
        />
      </div>

      {/* Header */}
      <header className="dashboard-header">
        <div className="header-container">
          <div className="header-content">
            <div className="header-left">
              <div className="header-icon">
                <svg className="vote-icon" viewBox="0 0 24 24">
                  <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" />
                </svg>
              </div>
              <div className="header-info">
                <h1>Online Voting System</h1>
                <p>Secure • Transparent • Democratic</p>
              </div>
            </div>
            <div className="header-actions">
              <button className="logout-btn" onClick={handleLogout}>
                <svg className="logout-icon" viewBox="0 0 24 24">
                  <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.59L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z" />
                </svg>
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="dashboard-main">
        <div className="main-card">
          {activeTab === "candidates" && (
            <div
              className="dashboard-title-section"
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "24px 32px",
                borderBottom: "1px solid #e5e7eb",
                backgroundColor: "#ffffff",
                borderRadius: "12px 12px 0 0",
              }}
            >
              <h1
                style={{
                  fontSize: "28px",
                  fontWeight: "700",
                  color: "#1f2937",
                  margin: 0,
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                }}
              >
                <svg
                  style={{ width: "32px", height: "32px", color: "#3b82f6" }}
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" />
                </svg>
                Dashboard
              </h1>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  backgroundColor: "#f3f4f6",
                  padding: "12px 20px",
                  borderRadius: "8px",
                  border: "1px solid #d1d5db",
                }}
              >
                <svg
                  style={{ width: "20px", height: "20px", color: "#6b7280" }}
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M16 4c0-1.11.89-2 2-2s2 .89 2 2-.89 2-2 2-2-.89-2-2zm4 18v-6h2.5l-2.54-7.63A2.996 2.996 0 0 0 17.15 7H16c-.8 0-1.54.37-2.01.97L12 10.5l-1.99-2.53C9.54 7.37 8.8 7 8 7H6.85c-1.18 0-2.24.75-2.81 1.37L1.5 16H4v6h4v-6h2.5l1.5-1.5L13.5 16H16v6h4z" />
                </svg>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-start",
                  }}
                >
                  <span
                    style={{
                      fontSize: "24px",
                      fontWeight: "700",
                      color: "#1f2937",
                      lineHeight: "1",
                    }}
                  >
                    {candidates.length}
                  </span>
                  <span
                    style={{
                      fontSize: "12px",
                      color: "#6b7280",
                      fontWeight: "500",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                    }}
                  >
                    Total Candidates
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="tabs-container">
            <div className="tabs-header">
              <div className="tabs-list">
                {["candidates", "vote"].map((tab) => (
                  <button
                    key={tab}
                    className={`tab-trigger ${
                      activeTab === tab ? "active" : ""
                    }`}
                    onClick={() => setActiveTab(tab)}
                  >
                    {tab === "candidates"
                      ? "View Candidates"
                      : "Cast Your Vote"}
                  </button>
                ))}
              </div>
            </div>

            {activeTab === "candidates" && (
              <div className="tab-content">
                <div className="content-header">
                  <h2>Meet the Candidates</h2>
                  <p>Get to know the candidates before making your decision.</p>
                </div>
                <div className="candidates-grid">
                  {candidates.map((candidate) => (
                    <div
                      key={candidate._id}
                      className={`candidate-card ${
                        expandedCards[candidate._id] ? "expanded" : ""
                      }`}
                    >
                      <div className="card-main">
                        <div className="candidate-image">
                          <img src={candidate.image} alt={candidate.name} />
                          <div className="party-tag">{candidate.party}</div>
                        </div>
                        <div className="candidate-info">
                          <div className="candidate-header">
                            <div>
                              <h3 className="candidate-name">
                                {candidate.name}
                              </h3>
                              <p className="candidate-position">
                                {candidate.position}
                              </p>
                            </div>
                            <button
                              className="expand-btn"
                              onClick={() =>
                                setExpandedCards((p) => ({
                                  ...p,
                                  [candidate._id]: !p[candidate._id],
                                }))
                              }
                            >
                              <svg
                                className={`expand-icon ${
                                  expandedCards[candidate._id] ? "rotated" : ""
                                }`}
                                viewBox="0 0 24 24"
                              >
                                <path d="M7 10l5 5 5-5z" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                      <div className="expandable-content">
                        <div className="expandable-inner">
                          <div className="candidate-description">
                            <h4>About</h4>
                            <p>{candidate.description}</p>
                          </div>
                          <div className="candidate-experience">
                            <h4>Experience</h4>
                            <p>{candidate.age}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "vote" && (
              <div
                className="tab-content"
                style={{ padding: "20px 32px", backgroundColor: "#ffffff" }}
              >
                <div className="voting-container">
                  {["President", "Vice President"].map((position) => {
                    const positionCandidates = candidates.filter(
                      (c) => c.position === position
                    );
                    if (!positionCandidates.length) return null;
                    return (
                      <div
                        key={position}
                        className="position-group"
                        style={{ marginBottom: "32px" }}
                      >
                        <h3
                          className="position-title"
                          style={{
                            fontSize: "20px",
                            fontWeight: "600",
                            color: "#1f2937",
                            marginBottom: "16px",
                            textAlign: "center",
                          }}
                        >
                          {position} Candidates
                        </h3>
                        <div className="voting-table">
                          <div className="table-header">
                            <div className="header-cell serial">#</div>
                            <div className="header-cell name">
                              Candidate Name
                            </div>
                            <div className="header-cell action">Action</div>
                          </div>
                          <div className="table-body">
                            {positionCandidates.map((candidate, index) => (
                              <div key={candidate._id} className="table-row">
                                <div className="table-cell serial">
                                  {index + 1}
                                </div>
                                <div className="table-cell name">
                                  <div className="candidate-info-row">
                                    <img
                                      src={candidate.image}
                                      alt={candidate.name}
                                      className="candidate-avatar"
                                    />
                                    <div className="candidate-details">
                                      <h4>{candidate.name}</h4>
                                      <p>{candidate.party}</p>
                                    </div>
                                  </div>
                                </div>
                                <div className="table-cell action">
                                  <button
                                    disabled={user.hasVoted}
                                    className="vote-table-btn"
                                    style={{
                                      cursor: user.hasVoted
                                        ? "not-allowed"
                                        : "pointer",
                                    }}
                                    onClick={() => handleVote(candidate.id)}
                                  >
                                    {user.hasVoted ? "Voted" : "Vote"}
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Rules Modal */}
      {showRulesModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Voting Rules & Guidelines</h3>
              <button
                className="close-btn"
                onClick={() => {
                  if (!termsAccepted) {
                    toast.error("Please accept the terms to proceed");
                    return;
                  }
                  setShowRulesModal(false);
                }}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <ul>
                <li>Each voter is allowed to vote only once</li>
                <li>Choose only one candidate from the list</li>
                <li>All information is kept confidential</li>
                <li>
                  Once confirmed, your vote is final and cannot be changed
                </li>
                <li>Ensure you read and accept the terms and conditions</li>
              </ul>
              <div
                className="terms-checkbox-container"
                style={{
                  marginTop: "20px",
                  padding: "15px",
                  borderTop: "1px solid #ddd",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                }}
              >
                <input
                  type="checkbox"
                  id="terms-checkbox"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  style={{ width: "18px", height: "18px", cursor: "pointer" }}
                />
                <label
                  htmlFor="terms-checkbox"
                  style={{
                    cursor: "pointer",
                    fontSize: "14px",
                    fontWeight: "500",
                    color: "#333",
                  }}
                >
                  I have read and agree to the terms and conditions
                </label>
              </div>
            </div>
            <div className="modal-footer">
              <button
                className={`modal-btn ${!termsAccepted ? "disabled" : ""}`}
                onClick={() => {
                  if (!termsAccepted) {
                    toast.error("Please accept the terms to proceed");
                    return;
                  }
                  setShowRulesModal(false);
                }}
                style={{
                  opacity: termsAccepted ? 1 : 0.5,
                  cursor: termsAccepted ? "pointer" : "not-allowed",
                }}
              >
                I Understand
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Vote Confirmation Modal */}
      {showVotingConfirmation && selectedCandidate && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Confirm Your Vote</h3>
              <button
                className="close-btn"
                onClick={() => {
                  setShowVotingConfirmation(false);
                  setSelectedCandidate(null);
                }}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to vote for:</p>
              <div className="confirmation-candidate">
                <img
                  src={selectedCandidate.image}
                  alt={selectedCandidate.name}
                />
                <div>
                  <h4>{selectedCandidate.name}</h4>
                  <p>
                    {selectedCandidate.position} - {selectedCandidate.party}
                  </p>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="modal-btn secondary"
                onClick={() => {
                  setShowVotingConfirmation(false);
                  setSelectedCandidate(null);
                }}
              >
                Cancel
              </button>
              <button className="modal-btn primary" onClick={confirmVote}>
                Confirm Vote
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default VoterDashboard;
