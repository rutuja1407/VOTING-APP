import React, { useState } from "react";
import CandidateList from "./Candidate-list";

export default function CandidateManager({ admin, onLogout }) {
  const [candidates, setCandidates] = useState([]);

  const addCandidate = (candidateData) => {
    setCandidates([
      ...candidates,
      { ...candidateData, id: String(Date.now()), createdAt: new Date(), updatedAt: new Date() },
    ]);
  };

  const editCandidate = (id, candidateData) => {
    setCandidates(candidates.map((c) => (c.id === id ? { ...c, ...candidateData, updatedAt: new Date() } : c)));
  };

  const deleteCandidate = (id) => {
    setCandidates(candidates.filter((c) => c.id !== id));
  };

  return (
    <div>
      <h2>Welcome, {admin.name}</h2>
      <button onClick={onLogout}>Logout</button>
      <CandidateList
        candidates={candidates}
        onAddCandidate={addCandidate}
        onEditCandidate={editCandidate}
        onDeleteCandidate={deleteCandidate}
      />
    </div>
  );
}
