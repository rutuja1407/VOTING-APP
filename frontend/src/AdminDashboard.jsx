import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  FiActivity,
  FiAlertTriangle,
  FiBarChart2,
  FiDownload,
  FiEdit2,
  FiInfo,
  FiLayers,
  FiPause,
  FiPlay,
  FiSettings,
  FiShare2,
  FiShield,
  FiTarget,
  FiTrash2,
  FiTrendingUp,
  FiUpload,
  FiUser,
  FiUsers,
  FiUserCheck,
  FiUserPlus,
  FiPlus,
  FiX,
} from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import "./AdminDashboard.css";

function EditCandidateModal({
  open,
  onClose,
  tab,
  setTab,
  form,
  handleFormChange,
  handleSaveCandidate,
  validationError,
  modalMode,
}) {
  if (!open) return null;
  return (
    <div className="candidate-modal-overlay">
      <div className="candidate-modal" role="dialog" aria-modal="true">
        <button
          className="candidate-modal-close"
          onClick={onClose}
          type="button"
          aria-label="Close"
        >
          <FiX size={24} />
        </button>
        <h2 className="candidate-modal-title">
          {modalMode === "edit" ? "Edit Candidate" : "Add Candidate"}
        </h2>
        <div className="candidate-modal-tabs">
          <button
            className={`candidate-modal-tab${tab === "basic" ? " active" : ""}`}
            onClick={() => setTab("basic")}
            type="button"
          >
            <FiUser /> Basic
          </button>
          <button
            className={`candidate-modal-tab${
              tab === "details" ? " active" : ""
            }`}
            onClick={() => setTab("details")}
            type="button"
          >
            <FiInfo /> Details
          </button>
          <button
            className={`candidate-modal-tab${
              tab === "social" ? " active" : ""
            }`}
            onClick={() => setTab("social")}
            type="button"
          >
            <FiShare2 /> Social
          </button>
          <button
            className={`candidate-modal-tab${
              tab === "settings" ? " active" : ""
            }`}
            onClick={() => setTab("settings")}
            type="button"
          >
            <FiSettings /> Settings
          </button>
        </div>
        <form
          className="candidate-modal-content"
          onSubmit={handleSaveCandidate}
        >
          {validationError && (
            <div className="validation-error">{validationError}</div>
          )}

          {tab === "basic" && (
            <>
              <div className="candidate-modal-section-title">
                Basic Information
              </div>
              <div className="candidate-modal-grid">
                <input
                  name="name"
                  value={form.name}
                  onChange={handleFormChange}
                  type="text"
                  placeholder="Enter candidate name"
                />
                <input
                  name="age"
                  value={form.age ?? ""}
                  onChange={handleFormChange}
                  type="number"
                  placeholder="Enter age"
                />
                <input
                  name="party"
                  value={form.party}
                  onChange={handleFormChange}
                  type="text"
                  placeholder="Enter party name"
                />
                <select
                  name="position"
                  value={form.position}
                  onChange={handleFormChange}
                >
                  <option value="">Select position</option>
                  <option>President</option>
                  <option>Governor</option>
                  <option>Mayor</option>
                </select>
                <input
                  name="email"
                  value={form.email ?? ""}
                  onChange={handleFormChange}
                  type="email"
                  placeholder="Enter email address"
                />
                <input
                  name="phone"
                  value={form.phone ?? ""}
                  onChange={handleFormChange}
                  type="text"
                  placeholder="Enter phone number"
                />
                <input
                  name="image"
                  value={form.image}
                  onChange={handleFormChange}
                  type="text"
                  placeholder="Enter image URL"
                />
              </div>
            </>
          )}

          {tab === "details" && (
            <>
              <div className="candidate-modal-section-title">
                Qualifications & Experience
              </div>
              <div className="candidate-modal-grid">
                <div style={{ display: "flex", alignItems: "center" }}>
                  <input
                    type="text"
                    placeholder="Add qualification"
                    style={{ flex: 1 }}
                  />
                  <button className="candidate-modal-qual-add" type="button">
                    <FiPlus />
                  </button>
                </div>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleFormChange}
                  placeholder="Describe relevant experience"
                  style={{ gridColumn: "span 2" }}
                />
                <textarea
                  placeholder="Enter election manifesto and key policies"
                  style={{ gridColumn: "span 2" }}
                />
              </div>
            </>
          )}

          {tab === "social" && (
            <>
              <div className="candidate-modal-section-title">
                Social Media Links
              </div>
              <div className="candidate-modal-grid">
                <input type="text" placeholder="https://twitter.com/username" />
                <input
                  type="text"
                  placeholder="https://facebook.com/username"
                />
                <input
                  type="text"
                  placeholder="https://instagram.com/username"
                />
              </div>
            </>
          )}

          {tab === "settings" && (
            <>
              <div className="candidate-modal-section-title">
                Candidate Settings
              </div>
              <div className="candidate-modal-grid">
                <select
                  name="status"
                  value={form.status}
                  onChange={handleFormChange}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>
            </>
          )}

          <div className="candidate-modal-actions">
            <button
              className="candidate-modal-cancel"
              type="button"
              onClick={onClose}
            >
              Cancel
            </button>
            <button className="candidate-modal-save" type="submit">
              {modalMode === "edit" ? "Update Candidate" : "Add Candidate"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function DeleteCandidateModal({ open, onClose, onDelete }) {
  if (!open) return null;
  return (
    <div className="candidate-modal-overlay">
      <div className="delete-modal" role="dialog" aria-modal="true">
        <button
          className="candidate-modal-close"
          onClick={onClose}
          aria-label="Close"
        >
          <FiX size={24} />
        </button>
        <h2 className="delete-modal-title">Delete Candidate</h2>
        <div className="delete-modal-desc">
          Are you sure you want to delete this candidate? This action cannot be
          undone.
        </div>
        <div className="candidate-modal-actions" style={{ marginTop: "2rem" }}>
          <button className="candidate-modal-cancel" onClick={onClose}>
            Cancel
          </button>
          <button className="delete-modal-btn" onClick={onDelete}>
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

function Snackbar({ open }) {
  if (!open) return null;
  return (
    <div className="snackbar">
      <span>✓ Candidate deleted successfully!</span>
    </div>
  );
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("add");
  const [editIndex, setEditIndex] = useState(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteIndex, setDeleteIndex] = useState(null);
  const [snackbar, setSnackbar] = useState(false);
  const [validationError, setValidationError] = useState("");
  const [modalTab, setModalTab] = useState("basic");

  const fileInputRef = useRef(null);

  // Bulk operations
  const [selectedCandidates, setSelectedCandidates] = useState(new Set());
  const [selectAll, setSelectAll] = useState(false);

  const emptyForm = {
    id: 0,
    name: "",
    age: "",
    party: "",
    position: "",
    image: "",
    description: "",
    email: "",
    phone: "",
    status: "active",
    votes: 0,
  };
  const [form, setForm] = useState(emptyForm);
  const navigate = useNavigate();

  const [candidates, setCandidates] = useState([]);

  const refreshCandidates = useCallback(async () => {
    try {
      const res = await fetch("http://localhost:8000/api/candidates");
      if (!res.ok) throw new Error("Failed to fetch candidates");
      const data = await res.json();
      setCandidates(Array.isArray(data?.candidates) ? data.candidates : []);
    } catch (err) {
      console.error("Error fetching candidates:", err);
      toast.error("Failed to refresh candidates");
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    const fetchCandidates = async () => {
      try {
        const res = await fetch("http://localhost:8000/api/candidates");
        const data = await res.json();
        if (!cancelled)
          setCandidates(Array.isArray(data?.candidates) ? data.candidates : []);
      } catch (err) {
        console.error("Error fetching candidates:", err);
      }
    };
    fetchCandidates();
    return () => {
      cancelled = true;
    };
  }, []);

  const analyticsData = useMemo(() => {
    const totalVotes = candidates.reduce(
      (sum, c) => sum + (Number(c.votes) || 0),
      0
    );
    const activeCandidates = candidates.filter(
      (c) => c.status === "active"
    ).length;
    const inactiveCandidates = candidates.filter(
      (c) => c.status === "inactive"
    ).length;
    const suspendedCandidates = candidates.filter(
      (c) => c.status === "suspended"
    ).length;
    const uniquePositions = new Set(candidates.map((c) => c.position)).size;
    const uniqueParties = new Set(candidates.map((c) => c.party)).size;
    const previousTotalVotes =
      totalVotes > 0 ? Math.floor(totalVotes * 0.89) : 0;
    const votesChange =
      previousTotalVotes > 0
        ? Math.round(
            ((totalVotes - previousTotalVotes) / previousTotalVotes) * 100
          )
        : 0;
    const previousActiveCandidates = Math.max(0, activeCandidates - 1);
    const activeCandidatesChange = activeCandidates - previousActiveCandidates;
    return {
      totalVotes,
      totalVotesChange: votesChange,
      activeCandidates,
      activeCandidatesChange,
      inactiveCandidates,
      suspendedCandidates,
      uniquePositions,
      uniqueParties,
      activeSessions: activeCandidates > 0 ? 1 : 0,
      activeSessionsStatus: activeCandidates > 0 ? "Live" : "Inactive",
      averageVotesPerCandidate:
        candidates.length > 0 ? Math.round(totalVotes / candidates.length) : 0,
    };
  }, [candidates]);

  const topPerformingCandidates = useMemo(() => {
    const total = analyticsData.totalVotes || 0;
    return [...candidates]
      .sort((a, b) => (Number(b.votes) || 0) - (Number(a.votes) || 0))
      .slice(0, 3)
      .map((candidate, index) => ({
        ...candidate,
        rank: index + 1,
        percentage:
          total > 0
            ? Math.round(((Number(candidate.votes) || 0) / total) * 100)
            : 0,
      }));
  }, [candidates, analyticsData.totalVotes]);

  const handleAddCandidate = useCallback(() => {
    setForm({ ...emptyForm, id: 0, votes: 0, status: "active" });
    setValidationError("");
    setModalMode("add");
    setEditIndex(null);
    setModalOpen(true);
    setModalTab("basic");
  }, []);

  const handleEditCandidate = useCallback(
    (idx) => {
      const c = candidates[idx];
      if (!c) return;
      setForm({ ...c });
      setValidationError("");
      setEditIndex(idx);
      setModalMode("edit");
      setModalOpen(true);
      setModalTab("basic");
    },
    [candidates]
  );

  const handleDeleteCandidate = useCallback((idx) => {
    setDeleteOpen(true);
    setDeleteIndex(idx);
  }, []);

  // Backend call for deleting single candidate, then refresh list
  const confirmDeleteCandidate = useCallback(async () => {
    if (deleteIndex === null) return;
    const candidateToDelete = candidates[deleteIndex];
    if (!candidateToDelete) return;

    try {
      const candidateId = candidateToDelete._id || candidateToDelete.id;
      const res = await fetch(
        `http://localhost:8000/api/candidates/${candidateId}`,
        { method: "DELETE" }
      );
      if (!res.ok) throw new Error("Failed to delete candidate");

      await refreshCandidates();
      setSnackbar(true);
      setTimeout(() => setSnackbar(false), 2200);
      setDeleteOpen(false);
    } catch (err) {
      toast.error("Failed to delete candidate");
      console.error(err);
    }
  }, [deleteIndex, candidates, refreshCandidates]);

  const handleFormChange = useCallback((e) => {
    const { name, value } = e.target;
    setForm((prev) =>
      prev[name] === value ? prev : { ...prev, [name]: value }
    );
  }, []);

  const validateForm = useCallback(() => {
    if (
      !form.name.trim() ||
      !form.image.trim() ||
      !form.position.trim() ||
      !form.party.trim() ||
      !form.description.trim()
    ) {
      setValidationError(
        "Please fill all required fields: Name, Image URL, Position, Party, and Description."
      );
      return false;
    }
    setValidationError("");
    return true;
  }, [form.description, form.image, form.name, form.party, form.position]);

  const createCandidateRequest = useCallback(async (payload) => {
    try {
      const res = await fetch("http://localhost:8000/api/candidates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to create candidate");
      return await res.json();
    } catch (e) {
      console.error(e);
      toast.error("Failed to create candidate");
      throw e;
    }
  }, []);

  const updateCandidateRequest = useCallback(async (id, payload) => {
    try {
      const res = await fetch(`http://localhost:8000/api/candidates/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) toast.error("Failed to update candidate");
      return await res.json();
    } catch (e) {
      console.error(e);
      toast.error("Failed to update candidate");
      throw e;
    }
  }, []);

  const handleSaveCandidate = useCallback(
    async (e) => {
      e.preventDefault();
      if (!validateForm()) return;

      if (modalMode === "add") {
        const newCandidate = {
          ...form,
          id: Date.now(),
          status: form.status || "active",
          votes: 0,
        };
        setModalOpen(false);
        setForm(emptyForm);
        try {
          await createCandidateRequest(newCandidate);
          toast.success("Candidate created");
          await refreshCandidates();
        } catch {}
      } else if (modalMode === "edit" && editIndex !== null) {
        const existing = candidates[editIndex];
        console.log("Editing candidate:", existing);
        if (!existing) return;
        const updated = { ...existing, ...form, id: existing.id };
        setModalOpen(false);
        setForm(emptyForm);
        try {
          await updateCandidateRequest(existing._id, updated);
          toast.success("Candidate updated");
          await refreshCandidates();
        } catch {}
      }
    },
    [
      candidates,
      createCandidateRequest,
      editIndex,
      emptyForm,
      form,
      modalMode,
      updateCandidateRequest,
      validateForm,
      refreshCandidates,
    ]
  );

  const handleSelectAll = useCallback(() => {
    setSelectedCandidates((prev) => {
      if (prev.size === candidates.length && prev.size > 0) {
        setSelectAll(false);
        return new Set();
      }
      const all = new Set(candidates.map((c) => c.id));
      setSelectAll(true);
      return all;
    });
  }, [candidates]);

  const handleSelectCandidate = useCallback(
    (candidateId) => {
      setSelectedCandidates((prev) => {
        const next = new Set(prev);
        if (next.has(candidateId)) next.delete(candidateId);
        else next.add(candidateId);
        setSelectAll(next.size === candidates.length && candidates.length > 0);
        return next;
      });
    },
    [candidates.length]
  );

  const handleImportData = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileUpload = useCallback(async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
  
    if (file.type !== "text/csv" && !file.name.endsWith(".csv")) {
      toast.error("Please select a valid CSV file");
      event.target.value = "";
      return;
    }
  
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const csvData = String(e.target?.result ?? "");
        const lines = csvData.split("\n").map((l) => l.trim()).filter(Boolean);
        if (lines.length < 2) {
          toast.error("CSV must contain at least one data row");
          return;
        }
  
        const headers = lines[0]
          .split(",")
          .map((h) => h.trim().replace(/"/g, ""));
        const required = ["name", "party", "position", "description"];
        const missing = required.filter(
          (h) => !headers.some((x) => x.toLowerCase().includes(h))
        );
        if (missing.length) {
          toast.error(`Missing columns: ${missing.join(", ")}`);
          return;
        }
  
        const newCandidates = [];
        for (let i = 1; i < lines.length; i++) {
          const values = lines[i]
            .split(",")
            .map((v) => v.trim().replace(/"/g, ""));
          if (values.length !== headers.length) continue;
  
          const obj = {};
          headers.forEach((h, idx) => {
            obj[h.toLowerCase()] = values[idx] || "";
          });
  
          if (obj.name && obj.party && obj.position && obj.description) {
            newCandidates.push({
              name: obj.name,
              age: obj.age || "",
              party: obj.party,
              position: obj.position,
              email: obj.email || "",
              phone: obj.phone || "",
              image: obj.image || "",
              description: obj.description,
              status: obj.status || "active",
              votes: 0,
            });
          }
        }
  
        if (!newCandidates.length) {
          toast.error("No valid candidate data found in CSV file");
          return;
        }
  
        // Send to backend
        const res = await fetch("http://localhost:8000/api/candidates/bulk-upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ candidates: newCandidates }),
        });
  
        const data = await res.json();
  
        if (res.ok) {
          toast.success(`Successfully uploaded ${data.candidates.length} candidates`);
          // Update frontend state if desired
          setCandidates((prev) => [...prev, ...data.candidates]);
        } else {
          toast.error(data.error || "Failed to upload candidates");
        }
      } catch (err) {
        console.error("Error parsing/uploading CSV:", err);
        toast.error("Error parsing or uploading CSV");
      }
    };
  
    reader.readAsText(file);
    event.target.value = "";
  }, []);
  

  const handleExportCSV = useCallback(() => {
    try {
      const headers = [
        "Name",
        "Age",
        "Party",
        "Position",
        "Email",
        "Phone",
        "Image",
        "Description",
        "Status",
        "Votes",
      ];
      const csvContent = [
        headers.join(","),
        ...candidates.map((c) =>
          [
            `"${c.name}"`,
            `"${c.age ?? ""}"`,
            `"${c.party}"`,
            `"${c.position}"`,
            `"${c.email ?? ""}"`,
            `"${c.phone ?? ""}"`,
            `"${c.image}"`,
            `"${c.description}"`,
            `"${c.status}"`,
            `"${c.votes}"`,
          ].join(",")
        ),
      ].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `candidates_export_${
        new Date().toISOString().split("T")[0]
      }.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success(
        `Successfully exported ${candidates.length} candidates to CSV`
      );
    } catch (err) {
      console.error("Error exporting CSV:", err);
      toast.error("Error exporting data to CSV");
    }
  }, [candidates]);

  const bulkUpdateStatus = useCallback(
    (status, msg) => {
      if (selectedCandidates.size === 0) {
        toast.error("Please select candidates first");
        return;
      }
      setCandidates((prev) =>
        prev.map((c) => (selectedCandidates.has(c.id) ? { ...c, status } : c))
      );
      toast.success(`${msg} ${selectedCandidates.size} candidates`);
      setSelectedCandidates(new Set());
      setSelectAll(false);
    },
    [selectedCandidates]
  );

  const handleBulkActivate = useCallback(
    () => bulkUpdateStatus("active", "Activated"),
    [bulkUpdateStatus]
  );
  const handleBulkDeactivate = useCallback(
    () => bulkUpdateStatus("inactive", "Deactivated"),
    [bulkUpdateStatus]
  );
  const handleBulkSuspend = useCallback(
    () => bulkUpdateStatus("suspended", "Suspended"),
    [bulkUpdateStatus]
  );

  // Bulk delete with backend calls and refresh
  const handleBulkDelete = useCallback(async () => {
    if (selectedCandidates.size === 0) {
      toast.error("Please select candidates to delete");
      return;
    }
console.log("Deleting candidates:", Array.from(selectedCandidates));
    try {
      await Promise.all(
        Array.from(selectedCandidates).map((id) =>
          fetch(`http://localhost:8000/api/candidates/${id}`, {
            method: "DELETE",
          }).then((res) => {
            if (!res.ok)
              throw new Error(`Failed to delete candidate with id ${id}`);
          })
        )
      );

      await refreshCandidates();

      toast.success(`Deleted ${selectedCandidates.size} candidates`);
      setSelectedCandidates(new Set());
      setSelectAll(false);
    } catch (error) {
      toast.error("Failed to delete selected candidates");
      console.error(error);
    }
  }, [selectedCandidates, refreshCandidates]);

  const getStatusBadge = useCallback((status) => {
    const map = {
      active: { background: "#e8f5e8", color: "#27a827" },
      inactive: { background: "#fff3e0", color: "#ff9500" },
      suspended: { background: "#ffeaea", color: "#ea4545" },
    };
    return map[status] || map.active;
  }, []);

  const handleLogout = useCallback(() => {
    toast.success("Logout successful");
    navigate("/", { replace: true });
  }, [navigate]);

  return (
    <div className="admin-dash-container">
      <header className="dash-header">
        <div className="dash-title-area">
          <span className="dash-icon">
            <FiShield size={40} />
          </span>
          <div>
            <div className="dash-title">Admin Dashboard</div>
            <div className="dash-subtitle">Online Voting System</div>
          </div>
        </div>
        <button className="dash-logout-btn" onClick={handleLogout}>
          Logout
        </button>
      </header>

      <nav className="dash-nav">
        <div
          className={`dash-nav-item${
            activeTab === "overview" ? " dash-nav-active" : ""
          }`}
          onClick={() => setActiveTab("overview")}
        >
          <FiUserCheck /> Overview
        </div>
        <div
          className={`dash-nav-item${
            activeTab === "candidates" ? " dash-nav-active" : ""
          }`}
          onClick={() => setActiveTab("candidates")}
        >
          <FiUserCheck /> Candidates{" "}
          <span className="nav-count">{candidates.length}</span>
        </div>
        <div
          className={`dash-nav-item${
            activeTab === "analytics" ? " dash-nav-active" : ""
          }`}
          onClick={() => setActiveTab("analytics")}
        >
          <FiBarChart2 /> Analytics
        </div>
        <div
          className={`dash-nav-item${
            activeTab === "bulk" ? " dash-nav-active" : ""
          }`}
          onClick={() => setActiveTab("bulk")}
        >
          <FiLayers /> Bulk Operations
        </div>
      </nav>

      <main className="dash-main">
        {activeTab === "overview" && (
          <>
            <div className="dash-section-header">
              <h2>Admin Dashboard</h2>
              <div className="dash-desc">
                Comprehensive management system for your online voting platform
                with facial detection
              </div>
            </div>
            <div className="dash-cards">
              <div className="dash-card">
                <div className="dash-card-title">Total Candidates</div>
                <div className="dash-card-value">{candidates.length}</div>
              </div>
              <div className="dash-card">
                <div className="dash-card-title">Positions</div>
                <div className="dash-card-value">
                  {analyticsData.uniquePositions}
                </div>
              </div>
              <div className="dash-card">
                <div className="dash-card-title">Political Parties</div>
                <div className="dash-card-value">
                  {analyticsData.uniqueParties}
                </div>
              </div>
              <div className="dash-card">
                <div className="dash-card-title">System Status</div>
                <div className="dash-card-value dash-active-status">Active</div>
              </div>
            </div>
          </>
        )}

        {activeTab === "candidates" && (
          <div className="candidate-panel-container">
            <div className="candidate-management-header">
              <div className="candidate-management-title">
                <FiUserPlus size={32} className="candidate-panel-icon" />
                <div>
                  <div
                    style={{
                      fontSize: "1.5rem",
                      fontWeight: 700,
                      color: "#6a5ae0",
                    }}
                  >
                    Candidate Management
                  </div>
                  <div style={{ fontSize: "1rem", color: "#818398" }}>
                    Manage candidates for the voting system
                  </div>
                </div>
              </div>
              <button
                className="add-candidate-btn"
                onClick={handleAddCandidate}
              >
                <FiUserPlus size={20} style={{ marginRight: "8px" }} />
                Add Candidate
              </button>
            </div>

            <div className="candidate-table">
              <div className="candidate-table-header">
                <div></div>
                <div>Name</div>
                <div>Party</div>
                <div>Position</div>
                <div>Description</div>
                <div>Actions</div>
              </div>
              {candidates.map((c, idx) => (
                <div className="candidate-table-row" key={c._id}>
                  <div className="candidate-avatar">{c.name?.[0]}</div>
                  <div className="candidate-info">{c.name}</div>
                  <div>
                    <span className="candidate-party">{c.party}</span>
                  </div>
                  <div>
                    <span className="candidate-position">{c.position}</span>
                  </div>
                  <div className="candidate-desc">{c.description}</div>
                  <div className="candidate-actions">
                    <button
                      className="candidate-edit-btn"
                      onClick={() => handleEditCandidate(idx)}
                      aria-label="Edit"
                    >
                      <FiEdit2 size={20} />
                    </button>
                    <button
                      className="candidate-delete-btn"
                      onClick={() => handleDeleteCandidate(idx)}
                      aria-label="Delete"
                    >
                      <FiTrash2 size={20} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "analytics" && (
          <div className="analytics-container">
            <div className="analytics-header">
              <div className="analytics-title">
                <FiBarChart2 size={32} className="analytics-icon" />
                <div>
                  <div className="analytics-main-title">
                    Analytics Dashboard
                  </div>
                  <div className="analytics-subtitle">
                    Real-time voting insights and performance metrics
                  </div>
                </div>
              </div>
            </div>

            <div className="analytics-cards-grid">
              <div className="analytics-card votes-card">
                <div className="analytics-card-header">
                  <div className="analytics-card-icon blue">
                    <FiBarChart2 size={20} />
                  </div>
                  <div className="analytics-card-title">Total Votes Cast</div>
                </div>
                <div className="analytics-card-content">
                  <div className="analytics-card-value">
                    {analyticsData.totalVotes.toLocaleString()}
                  </div>
                  <div
                    className={`analytics-card-trend ${
                      analyticsData.totalVotesChange >= 0
                        ? "positive"
                        : "negative"
                    }`}
                  >
                    <FiTrendingUp size={14} />
                    <span>
                      {analyticsData.totalVotesChange >= 0 ? "+" : ""}
                      {analyticsData.totalVotesChange}%
                    </span>
                  </div>
                </div>
              </div>

              <div className="analytics-card candidates-card">
                <div className="analytics-card-header">
                  <div className="analytics-card-icon purple">
                    <FiUsers size={20} />
                  </div>
                  <div className="analytics-card-title">Active Candidates</div>
                </div>
                <div className="analytics-card-content">
                  <div className="analytics-card-value">
                    {analyticsData.activeCandidates}
                  </div>
                  <div
                    className={`analytics-card-trend ${
                      analyticsData.activeCandidatesChange >= 0
                        ? "positive"
                        : "negative"
                    }`}
                  >
                    <FiTrendingUp size={14} />
                    <span>
                      {analyticsData.activeCandidatesChange >= 0 ? "+" : ""}
                      {analyticsData.activeCandidatesChange}
                    </span>
                  </div>
                </div>
              </div>

              <div className="analytics-card sessions-card">
                <div className="analytics-card-header">
                  <div className="analytics-card-icon green">
                    <FiActivity size={20} />
                  </div>
                  <div className="analytics-card-title">Active Sessions</div>
                </div>
                <div className="analytics-card-content">
                  <div className="analytics-card-value">
                    {analyticsData.activeSessions}
                  </div>
                  <div
                    className={`analytics-card-status ${
                      analyticsData.activeSessionsStatus === "Live"
                        ? "live"
                        : "inactive"
                    }`}
                  >
                    <span>{analyticsData.activeSessionsStatus}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="top-performers-section">
              <div className="top-performers-header">
                <div className="top-performers-icon">
                  <FiTarget size={24} />
                </div>
                <h3>Top Performing Candidates</h3>
              </div>

              <div className="top-performers-list">
                {topPerformingCandidates.map((candidate) => (
                  <div key={candidate.id} className="top-performer-item">
                    <div className="performer-left-section">
                      <div className={`performer-rank rank-${candidate.rank}`}>
                        {candidate.rank}
                      </div>
                      <div className="performer-avatar">
                        {candidate.image ? (
                          <>
                            <img
                              src={candidate.image}
                              alt={candidate.name}
                              onError={(e) => {
                                const target = e.target;
                                target.style.display = "none";
                                const next = target.nextSibling;
                                if (next) next.style.display = "flex";
                              }}
                            />
                            <div
                              className="performer-avatar-fallback"
                              style={{ display: "none" }}
                            >
                              {candidate.name[0]}
                            </div>
                          </>
                        ) : (
                          <div className="performer-avatar-fallback">
                            {candidate.name[0]}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="performer-info">
                      <div className="performer-name">{candidate.name}</div>
                      <div className="performer-position">
                        {candidate.position}
                      </div>
                    </div>

                    <div className="performer-stats">
                      <div className="performer-votes">
                        {candidate.votes} votes
                      </div>
                      <div className="performer-percentage">
                        {candidate.percentage}%
                      </div>
                      <div className="performer-progress">
                        <div
                          className="performer-progress-fill"
                          style={{ width: `${candidate.percentage}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === "bulk" && (
          <div className="bulk-operations-container">
            <div className="bulk-operations-header">
              <div className="bulk-operations-title">
                <FiLayers size={32} className="bulk-operations-icon" />
                <div>
                  <div className="bulk-title">Bulk Operations</div>
                  <div className="bulk-subtitle">
                    Import, export, and manage candidates in bulk
                  </div>
                </div>
              </div>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".csv"
              style={{ display: "none" }}
            />

            <div className="bulk-operations-grid">
              <div className="bulk-section import-section">
                <div className="bulk-section-header">
                  <FiUpload className="section-icon" size={24} />
                  <h3>Import Candidates</h3>
                </div>
                <p className="bulk-section-desc">
                  Upload CSV file or paste data to import multiple candidates
                </p>
                <div className="bulk-action-area">
                  <button
                    className="bulk-import-btn"
                    onClick={handleImportData}
                  >
                    <FiUpload size={20} />
                    Import Data
                  </button>
                  <div className="bulk-file-icon">
                    <FiUpload size={24} />
                  </div>
                </div>
              </div>

              <div className="bulk-section export-section">
                <div className="bulk-section-header">
                  <FiDownload className="section-icon" size={24} />
                  <h3>Export Candidates</h3>
                </div>
                <p className="bulk-section-desc">
                  Download all candidate data as CSV file
                </p>
                <div className="bulk-action-area">
                  <button className="bulk-export-btn" onClick={handleExportCSV}>
                    <FiDownload size={20} />
                    Export CSV
                  </button>
                  <div className="bulk-candidates-count">
                    {candidates.length} candidates available
                  </div>
                </div>
              </div>
            </div>

            <div className="bulk-actions-section">
              <div className="bulk-actions-header">
                <FiUser className="section-icon" size={24} />
                <h3>Bulk Actions</h3>
              </div>
              <div className="bulk-actions-grid">
                <button
                  className="bulk-action-btn activate-btn"
                  onClick={handleBulkActivate}
                >
                  <FiPlay size={20} />
                  Activate Selected
                </button>
                <button
                  className="bulk-action-btn deactivate-btn"
                  onClick={handleBulkDeactivate}
                >
                  <FiPause size={20} />
                  Deactivate Selected
                </button>
                <button
                  className="bulk-action-btn suspend-btn"
                  onClick={handleBulkSuspend}
                >
                  <FiAlertTriangle size={20} />
                  Suspend Selected
                </button>
                <button
                  className="bulk-action-btn delete-btn"
                  onClick={handleBulkDelete}
                >
                  <FiTrash2 size={20} />
                  Delete Selected
                </button>
              </div>
              <div className="selected-count">
                Selected: {selectedCandidates.size} candidates
              </div>
            </div>

            <div className="bulk-candidate-list">
              <div className="bulk-list-header">
                <h3>Candidate List</h3>
                <p>Select candidates to perform bulk actions</p>
              </div>

              <div className="bulk-candidate-table">
                <div className="bulk-table-header">
                  <div className="bulk-checkbox-cell">
                    <input
                      type="checkbox"
                      checked={selectAll}
                      onChange={handleSelectAll}
                      className="bulk-checkbox"
                    />
                  </div>
                  <div>Name</div>
                  <div>Party</div>
                  <div>Position</div>
                  <div>Status</div>
                </div>

                {candidates.map((candidate) => (
                  <div key={candidate.id} className="bulk-table-row">
                    <div className="bulk-checkbox-cell">
                      <input
                        type="checkbox"
                        checked={selectedCandidates.has(candidate.id)}
                        onChange={() => handleSelectCandidate(candidate.id)}
                        className="bulk-checkbox"
                      />
                    </div>
                    <div className="bulk-candidate-info">
                      <div className="bulk-candidate-avatar">
                        {candidate.name[0]}
                      </div>
                      <span>{candidate.name}</span>
                    </div>
                    <div>
                      <span className="bulk-candidate-party">
                        {candidate.party}
                      </span>
                    </div>
                    <div>
                      <span className="bulk-candidate-position">
                        {candidate.position}
                      </span>
                    </div>
                    <div>
                      <span
                        className="bulk-candidate-status"
                        style={getStatusBadge(candidate.status)}
                      >
                        {candidate.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <EditCandidateModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          tab={modalTab}
          setTab={setModalTab}
          form={form}
          handleFormChange={handleFormChange}
          handleSaveCandidate={handleSaveCandidate}
          validationError={validationError}
          modalMode={modalMode}
        />
        <DeleteCandidateModal
          open={deleteOpen}
          onClose={() => setDeleteOpen(false)}
          onDelete={confirmDeleteCandidate}
        />
        <Snackbar open={snackbar} />
      </main>
    </div>
  );
}
