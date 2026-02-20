import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./VoterDashboard.css";
import { toast } from "sonner";
import { useUser } from "./contexts/user.context";

function VoterDashboard() {
  const navigate = useNavigate();
  const [showRulesModal, setShowRulesModal] = useState(true);
  const [showVotingConfirmation, setShowVotingConfirmation] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [votes, setVotes] = useState({});
  const [activeTab, setActiveTab] = useState("candidates");
  const [expandedCards, setExpandedCards] = useState({});
  // Add state for terms acceptance checkbox
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [candidates, setCandidates] = useState([]);
  const { user, setUser } = useUser();

  // Add a new state to track loading/voting action
  const handleVote = (candidateId) => {
    const candidate = candidates.find((c) => c.id === candidateId);
    if (candidate) {
      setSelectedCandidate(candidate);
      setShowVotingConfirmation(true);
    }
  };

  const confirmVote = async () => {
    if (selectedCandidate) {
      setShowVotingConfirmation(false);

      try {
        const res = await fetch("http://localhost:8000/api/vote/", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            aadhaar: localStorage.getItem("aadhaar"),
            position: selectedCandidate.position,
            candidateId: selectedCandidate._id,
          }),
        });

        const data = await res.json();
        console.log("data", data);

        if (res.status === 200) {
          toast.success(
            `Vote cast successfully for ${selectedCandidate.name}!`
          );
          // Update local votes state immediately
          setVotes((prev) => ({
            ...prev,
            [selectedCandidate.position]: selectedCandidate.id,
          }));
          setUser((user) => ({ ...user, hasVoted: true }));
        } else {
          toast.error(data.error || "Failed to cast vote");
        }
      } catch (error) {
        console.log("error casting vote", error);

        toast.error("Failed to cast vote");
      } finally {
        setSelectedCandidate(null);
      }
    }
  };

  const toggleExpand = (candidateId) => {
    setExpandedCards((prev) => ({
      ...prev,
      [candidateId]: !prev[candidateId],
    }));
  };

  const handleLogout = () => {
    toast.success("Logout successfull");
    setUser({});
    localStorage.removeItem("aadhaar");
    navigate("/", { replace: true });
  };

  // Updated closeRulesModal function with validation
  const closeRulesModal = () => {
    if (!termsAccepted) {
      toast.error("Please accept the terms and conditions to proceed");
      return;
    }
    setShowRulesModal(false);
  };

  // Handle checkbox change
  const handleTermsChange = (event) => {
    setTermsAccepted(event.target.checked);
  };

  const closeVotingConfirmation = () => {
    setShowVotingConfirmation(false);
    setSelectedCandidate(null);
  };

  useEffect(() => {
    const fetchCandidates = async () => {
      try {
        const res = await fetch("http://localhost:8000/api/candidates");
        const data = await res.json();
        if (res.status === 200) {
          setCandidates(data.candidates);
        } else {
          toast.error(data.error || "Failed to fetch candidates");
        }
        console.log("Fetched candidates:", data);
      } catch (error) {
        console.log("Error fetching candidates:", error);
        toast.error("Failed to fetch candidates");
      }
    };
    fetchCandidates();
  }, []);

  return (
    <div className="voter-dashboard">
      {/* Header - Keep same */}
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

      {/* Main Content */}
      <main className="dashboard-main">
        <div className="main-card">
          {/* Conditionally render Dashboard Title Section - Only show for 'candidates' tab */}
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
              <div className="dashboard-title-left">
                <h1
                  style={{
                    fontSize: "28px",
                    fontWeight: "700",
                    color: "#1f2937",
                    margin: "0",
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
              </div>

              <div className="dashboard-title-right">
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
            </div>
          )}

          {/* Tabs - Keep same */}
          <div className="tabs-container">
            <div className="tabs-header">
              <div className="tabs-list">
                <button
                  className={`tab-trigger ${
                    activeTab === "candidates" ? "active" : ""
                  }`}
                  onClick={() => setActiveTab("candidates")}
                >
                  View Candidates
                </button>
                <button
                  className={`tab-trigger ${
                    activeTab === "vote" ? "active" : ""
                  }`}
                  onClick={() => setActiveTab("vote")}
                >
                  Cast Your Vote
                </button>
              </div>
            </div>

            {/* Candidates View */}
            {activeTab === "candidates" && (
              <div className="tab-content">
                <div className="content-header">
                  <h2>Meet the Candidates</h2>
                  <p>Get to know the candidates before making your decision.</p>
                </div>

                <div className="candidates-grid">
                  {candidates.map((candidate) => (
                    <div
                      key={candidate.id}
                      className={`candidate-card ${
                        expandedCards[candidate.id] ? "expanded" : ""
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
                              onClick={() => toggleExpand(candidate.id)}
                            >
                              <svg
                                className={`expand-icon ${
                                  expandedCards[candidate.id] ? "rotated" : ""
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

            {/* Voting Interface - CLEAN, NO DISTRACTIONS */}
            {activeTab === "vote" && (
              <div
                className="tab-content"
                style={{
                  padding: "20px 32px",
                  backgroundColor: "#ffffff",
                }}
              >
                <div className="voting-container">
                  {/* Removed the voting-header section completely for clean interface */}

                  {/* Group candidates by position */}
                  {["President", "Vice President"].map((position) => {
                    const positionCandidates = candidates.filter(
                      (c) => c.position === position
                    );
                    if (positionCandidates.length === 0) return null;

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

                        {/* Table Format */}
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
                              <div key={candidate.id} className="table-row">
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
                                    style={{
                                      cursor: user.hasVoted
                                        ? "not-allowed"
                                        : "pointer",
                                    }}
                                    className={`vote-table-btn`}
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

      {/* Rules Modal with Terms and Conditions Checkbox */}
      {showRulesModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Voting Rules & Guidelines</h3>
              <button className="close-btn" onClick={closeRulesModal}>
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

              {/* Terms and Conditions Checkbox */}
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
                  onChange={handleTermsChange}
                  style={{
                    width: "18px",
                    height: "18px",
                    cursor: "pointer",
                  }}
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
                onClick={closeRulesModal}
                style={{
                  opacity: termsAccepted ? "1" : "0.5",
                  cursor: termsAccepted ? "pointer" : "not-allowed",
                }}
              >
                I Understand
              </button>
            </div>
          </div>
        </div>
      )}

      {showVotingConfirmation && selectedCandidate && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Confirm Your Vote</h3>
              <button className="close-btn" onClick={closeVotingConfirmation}>
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
                onClick={closeVotingConfirmation}
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
