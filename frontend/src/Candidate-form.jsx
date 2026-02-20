import React, { useState, useEffect } from "react";

export default function CandidateForm({ isOpen, onClose, onSubmit, candidate, mode }) {
  const [name, setName] = useState("");
  const [party, setParty] = useState("");
  const [position, setPosition] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");

 useEffect(() => {
  if (candidate) {
    setName(candidate.name || "");
    setParty(candidate.party || "");
    setPosition(candidate.position || "");
    setDescription(candidate.description || "");
    setImageUrl(candidate.imageUrl || "");
  } else {
    setName("");
    setParty("");
    setPosition("");
    setDescription("");
    setImageUrl("");
  }
}, [candidate]);  


  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ name, party, position, description, imageUrl });
  };

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop">
      <div className="modal-content">
        <h2>{mode === "add" ? "Add Candidate" : "Edit Candidate"}</h2>
        <form onSubmit={handleSubmit} className="candidate-form">
          <label>
            Name
            <input value={name} onChange={(e) => setName(e.target.value)} required />
          </label>
          <label>
            Party
            <input value={party} onChange={(e) => setParty(e.target.value)} required />
          </label>
          <label>
            Position
            <input value={position} onChange={(e) => setPosition(e.target.value)} required />
          </label>
          <label>
            Description
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows="3" />
          </label>
          <label>
            Image URL
            <input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} />
          </label>
          <div className="form-buttons">
            <button type="button" onClick={onClose} className="btn cancel-btn">
              Cancel
            </button>
            <button type="submit" className="btn submit-btn">
              {mode === "add" ? "Add" : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
