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
  const [phase, setPhase] = useState("VIEW");

  // ── FEATURE 1: Gate state ──────────────────────────────────────────────────
  const [monitoringStarted, setMonitoringStarted] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState("Loading face detection models...");

  // ── FEATURE 2: Timer starts at 120 (VIEW phase) ───────────────────────────
  const [timeLeft, setTimeLeft] = useState(60);
  const timerRef = useRef(null);

  const violationCountRef = useRef(0);
  const lastFaceBoxRef = useRef(null);
  const stableFaceRef = useRef(null);
  const videoRef = useRef(null);
  const videoDisplayRef = useRef(null);
  const streamRef = useRef(null);
  const monitorRef = useRef(null);
  const modelsLoadedRef = useRef(false);
  const isLoggingOutRef = useRef(false); // ── FEATURE 3 & 4: prevent duplicate logout/ban

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

  // ── FEATURE 3 & 4: Ban user in DB + send admin notification ───────────────
  const banUserAndNotifyAdmin = async (reason) => {
    const voterId = localStorage.getItem("voterId");
    if (!voterId) return;

    // Fire both requests in parallel; don't let one failure block the other
    await Promise.allSettled([
      // Feature 3: Set isBanned = true on the voter's document
      fetch(`http://localhost:8000/api/auth/${voterId}/ban`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isBanned: true }),
      }),

      // Feature 4: Push a notification record for the admin panel to read
      fetch("http://localhost:8000/api/notifications/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "SUSPICIOUS_ACTIVITY",
          voterId,
          message: `Voter (ID: ${voterId}) was forcefully logged out. Reason: ${reason}`,
          timestamp: new Date().toISOString(),
        }),
      }),
    ]);
  };

  const forceLogout = async (reason) => {
    if (isLoggingOutRef.current) return; // prevent double-trigger from fast intervals
    isLoggingOutRef.current = true;

    stopMonitoring();
    clearInterval(timerRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    console.log(`Forcing logout: ${reason}`);
    await banUserAndNotifyAdmin(reason || "Detected suspicious activity"); 

    localStorage.clear();
    toast.error("Logged out due to suspicious activity");
    window.location.href = "/";
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
        return;
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
          if (violationCountRef.current >= 3) {
            forceLogout(violation);
          }
        } else {
          violationCountRef.current = 0;
        }
      } catch (err) {
        console.error("Monitoring error:", err);
      }
    }, 500);
  };

  const evaluateDetectionStable = async (detection) => {
    if (!detection) return "No face detected";

    const box = detection.detection.box;

    if (!stableFaceRef.current) {
      stableFaceRef.current = detection.descriptor;
      lastFaceBoxRef.current = box;
      return null;
    }

    const distance = faceapi.euclideanDistance(
      stableFaceRef.current,
      detection.descriptor
    );

    if (distance > 0.6) return "Different person detected";

    const lastBox = lastFaceBoxRef.current;
    if (lastBox) {
      const dx = Math.abs(box.x - lastBox.x);
      const dy = Math.abs(box.y - lastBox.y);
      if (dx > 80 || dy > 80) return "Suspicious movement detected";
    }

    lastFaceBoxRef.current = box;

    if (detectPhoneHeuristic(detection)) return "Mobile phone detected";

    return null;
  };

  const captureReferenceFace = async () => {
    if (!videoRef.current || !modelsLoadedRef.current) return;

    setLoadingMsg("Detecting your face — please look at the camera...");

    for (let attempt = 1; attempt <= 7; attempt++) {
      try {
        const detection = await faceapi
          .detectSingleFace(videoRef.current, detectorOptionsRef.current)
          .withFaceLandmarks()
          .withFaceDescriptor();

        if (detection) {
          stableFaceRef.current = detection.descriptor;
          toast.success("Face verified. Monitoring started.");

          // ✅ FEATURE 1: Unlock the UI — triggers timer effect too
          setMonitoringStarted(true);
          startContinuousMonitoring();
          return;
        }
      } catch (err) {
        console.error(`Face capture attempt ${attempt} failed`);
      }

      await new Promise((r) => setTimeout(r, 500));
    }

    forceLogout("Face not detected properly");
  };

  const detectPhoneHeuristic = (detection) => {
    const landmarks = detection.landmarks;
    if (!landmarks) return false;

    const jaw = landmarks.getJawOutline();
    const nose = landmarks.getNose();
    if (!jaw || !nose) return false;

    const faceBox = detection.detection.box;
    if (faceBox.width < 80 || faceBox.height < 80) return true;

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

  const startTimer = (duration, onExpire) => {
    clearInterval(timerRef.current);
    setTimeLeft(duration);

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          onExpire();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // ─── Effects ─────────────────────────────────────────────────────────────────

  useEffect(() => {
    fetch("http://localhost:8000/api/candidates")
      .then((r) => r.json())
      .then((data) => setCandidates(data.candidates ?? []))
      .catch(() => toast.error("Failed to fetch candidates"));
  }, []);

  useEffect(() => {
    const MODEL_URL = "/models";

    Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
      faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
      faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
    ])
      .then(() => {
        setModelsLoaded(true);
        modelsLoadedRef.current = true;
        setLoadingMsg("Models ready. Please position your face in frame...");
      })
      .catch(() => toast.error("Failed to load face detection models"));
  }, []);

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

  useEffect(() => {
    if (!modelsLoaded) return;

    const waitForVideoAndStart = async () => {
      const video = videoRef.current;
      if (!video) return;

      const checkReady = () => video.readyState >= 3 && video.videoWidth > 0;

      let attempts = 0;
      while (!checkReady() && attempts < 10) {
        await new Promise((res) => setTimeout(res, 300));
        attempts++;
      }

      if (checkReady()) {
        await captureReferenceFace();
      } else {
        forceLogout("Camera not initialized properly");
      }
    };

    waitForVideoAndStart();
  }, [modelsLoaded]);

  // ✅ FEATURE 2: Timers only start AFTER monitoring begins
  useEffect(() => {
    if (!monitoringStarted) return;

    // VIEW phase — exactly 60 seconds
    startTimer(60, () => {
      setPhase("VOTE");
      setActiveTab("vote");

      // VOTE phase — exactly 60 seconds
      startTimer(60, () => {
        forceLogout("Voting time expired");
      });
    });
  }, [monitoringStarted]); // runs exactly once when monitoring flips to true

  useEffect(() => {
    const handlePopState = () => {
      if (phase === "VOTE") {
        setPhase("LOCKED");
        startTimer(60, () => forceLogout("Back navigation detected"));
        setActiveTab("candidates");
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [phase]);

  useEffect(() => {
    return () => clearInterval(timerRef.current);
  }, []);

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="voter-dashboard">

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
          boxShadow: monitoringStarted ? "0 4px 16px rgba(0,0,0,0.3)" : "none",
          border: monitoringStarted ? "2px solid #3b82f6" : "none",
          zIndex: 9999,
          backgroundColor: "#1f2937",
          // Hide visually but keep in DOM so videoRef stays valid
          visibility: monitoringStarted ? "visible" : "hidden",
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
          }}
        />
      </div>

      {/* ✅ FEATURE 1 — Full-screen loading screen until face is detected */}
      {!monitoringStarted && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            background: "#0f172a",
            zIndex: 99999,
            gap: "28px",
          }}
        >
          {/* Spinner */}
          <div
            style={{
              width: "72px",
              height: "72px",
              borderRadius: "50%",
              border: "5px solid rgba(59,130,246,0.15)",
              borderTopColor: "#3b82f6",
              animation: "vd-spin 1s linear infinite",
            }}
          />

          {/* Dynamic message */}
          <p
            style={{
              color: "#94a3b8",
              fontSize: "16px",
              fontWeight: 500,
              textAlign: "center",
              maxWidth: "320px",
              lineHeight: "1.7",
            }}
          >
            {loadingMsg}
          </p>

          <p style={{ color: "#475569", fontSize: "13px" }}>
            Please ensure your face is clearly visible
          </p>

          <style>{`
            @keyframes vd-spin {
              to { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      )}

      {/* ✅ Main dashboard — only rendered after monitoring starts */}
      {monitoringStarted && (
        <>
          {/* Timer */}
          <div
            style={{
              position: "fixed",
              top: "16px",
              left: "16px",
              background: "#111",
              color: "#fff",
              padding: "10px 16px",
              borderRadius: "8px",
              fontWeight: "600",
              zIndex: 9999,
            }}
          >
            ⏳ {Math.floor(timeLeft / 60)}:
            {String(timeLeft % 60).padStart(2, "0")}
          </div>

          {/* Header */}
          <header className="dashboard-header">
            <div className="header-container">
              <div className="header-content">
                <div className="header-left">
                  <div className="header-info">
                    <h1>Online Voting System</h1>
                    <p>Secure • Transparent • Democratic</p>
                  </div>
                </div>
                <button className="logout-btn" onClick={handleLogout}>
                  Logout
                </button>
              </div>
            </div>
          </header>

          {/* Main */}
          <main className="dashboard-main">
            <div className="main-card">

              <div className="dashboard-top">
                <div className="dashboard-title">
                  <h2>Voter Dashboard</h2>
                  <p>Review candidates and cast your vote</p>
                </div>
                <div className="candidate-count-box">
                  <span>Total Candidates</span>
                  <h3>{candidates.length}</h3>
                </div>
              </div>

              {/* Tabs */}
              <div className="tabs-container">
                <div className="tabs-header">
                  <div className="tabs-list">
                    {["candidates", "vote"]
                      .filter((tab) => !(phase === "VOTE" && tab === "candidates"))
                      .map((tab) => (
                        <button
                          key={tab}
                          className={`tab-trigger ${activeTab === tab ? "active" : ""}`}
                          onClick={() => {
                            if (tab === "vote") {
                              if (phase === "VOTE") return; 
                              setPhase("VOTE");
                              setActiveTab("vote");
                              startTimer(60, () => forceLogout("Voting time expired"));
                              return;
                            }
                            if (phase === "VOTE" && tab === "candidates") return;
                            setActiveTab(tab);
                          }}
                        >
                          {tab === "candidates" ? "View Candidates" : "Cast Your Vote"}
                        </button>
                      ))}
                  </div>
                </div>

                {/* Candidates Tab */}
                {activeTab === "candidates" && (
                  <div className="tab-content">
                    <div className="content-header">
                      <h2>Candidate Information</h2>
                      <p>Select "Cast Your Vote" when you're ready</p>
                    </div>
                    <div className="candidates-grid">
                      {candidates.map((candidate) => (
                        <div
                          key={candidate._id}
                          className={`candidate-card ${expandedCards[candidate._id] ? "expanded" : ""}`}
                        >
                          <div className="card-main">
                            <div className="candidate-image">
                              <img src={candidate.image} alt={candidate.name} />
                              <div className="party-tag">{candidate.party}</div>
                            </div>
                            <div className="candidate-info">
                              <div className="candidate-header">
                                <div>
                                  <h3 className="candidate-name">{candidate.name}</h3>
                                  <p className="candidate-position">{candidate.position}</p>
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
                                  ▼
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

                {/* Vote Tab */}
                {activeTab === "vote" && (
                  <div className="tab-content">
                    <div className="voting-container">
                      {[...new Set(candidates.map((c) => c.position))].map((position) => {
                        const positionCandidates = candidates.filter(
                          (c) => c.position === position
                        );
                        if (!positionCandidates.length) return null;

                        return (
                          <div key={position} className="position-group">
                            <h3 className="position-title">{position} Candidates</h3>
                            <div className="voting-table">
                              <div className="table-header">
                                <div className="header-cell serial">#</div>
                                <div className="header-cell name">Candidate Name</div>
                                <div className="header-cell action">Action</div>
                              </div>
                              <div className="table-body">
                                {positionCandidates.map((candidate, index) => (
                                  <div key={candidate._id} className="table-row">
                                    <div className="table-cell serial">{index + 1}</div>
                                    <div className="table-cell name">
                                      <div className="candidate-info-row">
                                        <img
                                          src={candidate.image}
                                          alt={candidate.name}
                                          className="candidate-avatar"
                                        />
                                        <div>
                                          <h4>{candidate.name}</h4>
                                          <p>{candidate.party}</p>
                                        </div>
                                      </div>
                                    </div>
                                    <div className="table-cell action">
                                      <button
                                        disabled={user.hasVoted}
                                        className="vote-table-btn"
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
                    <li>Once confirmed, your vote is final and cannot be changed</li>
                    <li>Ensure you read and accept the terms and conditions</li>
                  </ul>
                  <div
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
                      style={{ cursor: "pointer", fontSize: "14px", fontWeight: "500", color: "#333" }}
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
                    style={{ opacity: termsAccepted ? 1 : 0.5, cursor: termsAccepted ? "pointer" : "not-allowed" }}
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
                    <img src={selectedCandidate.image} alt={selectedCandidate.name} />
                    <div>
                      <h4>{selectedCandidate.name}</h4>
                      <p>{selectedCandidate.position} - {selectedCandidate.party}</p>
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
        </>
      )}
    </div>
  );
}

export default VoterDashboard;