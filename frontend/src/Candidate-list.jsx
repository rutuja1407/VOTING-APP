import React, { useState } from "react";
import { Edit, Trash2, Plus, Users } from "lucide-react";
import CandidateForm from "./Candidate-form";
import "./style.css";

export default function CandidateList({
  candidates,
  onAddCandidate,
  onEditCandidate,
  onDeleteCandidate,
  FormComponent = CandidateForm,
}) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCandidate, setEditingCandidate] = useState(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [candidateToDelete, setCandidateToDelete] = useState(null);
  const [formMode, setFormMode] = useState("add");

  const handleAddClick = () => {
    setFormMode("add");
    setEditingCandidate(null);
    setIsFormOpen(true);
  };

  const handleEditClick = (candidate) => {
    setFormMode("edit");
    setEditingCandidate(candidate);
    setIsFormOpen(true);
  };

  const handleDeleteClick = (id) => {
    setCandidateToDelete(id);
    setDeleteConfirmOpen(true);
  };

  const handleFormSubmit = (candidateData) => {
    if (formMode === "add") {
      onAddCandidate(candidateData);
    } else if (editingCandidate) {
      onEditCandidate(editingCandidate.id, candidateData);
    }
    setIsFormOpen(false);
  };

  const handleDeleteConfirm = () => {
    onDeleteCandidate(candidateToDelete);
    setDeleteConfirmOpen(false);
    setCandidateToDelete(null);
  };

  return (
    <div className="space-y-6 candidate-list-card">
      <div className="card-header">
        <div className="header-left">
          <div className="icon-circle">
            <Users className="icon" />
          </div>
          <div>
            <h2 className="card-title">Candidate Management</h2>
            <p className="text-muted">Manage candidates for the voting system</p>
          </div>
        </div>
        <button className="btn add-btn" onClick={handleAddClick}>
          <Plus className="icon-small" /> Add Candidate
        </button>
      </div>

      <div className="card-content">
        {candidates.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon-circle">
              <Users className="icon-large muted-icon" />
            </div>
            <h3>No candidates yet</h3>
            <p>Get started by adding your first candidate</p>
            <button className="btn add-btn" onClick={handleAddClick}>
              <Plus className="icon-small" /> Add First Candidate
            </button>
          </div>
        ) : (
          <table className="candidate-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Party</th>
                <th>Position</th>
                <th>Description</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {candidates.map((candidate) => (
                <tr key={candidate.id} className="hover-row">
                  <td>
                    <div className="name-cell">
                      {candidate.imageUrl && (
                        <img
                          src={candidate.imageUrl}
                          alt={candidate.name}
                          className="candidate-image"
                        />
                      )}
                      <span className="font-medium">{candidate.name}</span>
                    </div>
                  </td>
                  <td>
                    <span className="badge secondary-badge">{candidate.party}</span>
                  </td>
                  <td>
                    <span className="badge outline-badge">{candidate.position}</span>
                  </td>
                  <td className="truncate-cell" title={candidate.description}>
                    {candidate.description}
                  </td>
                  <td className="text-right">
                    <button
                      className="btn outline-btn"
                      onClick={() => handleEditClick(candidate)}
                      title="Edit"
                    >
                      <Edit className="icon-small" />
                    </button>
                    <button
                      className="btn outline-btn delete-btn"
                      onClick={() => handleDeleteClick(candidate.id)}
                      title="Delete"
                    >
                      <Trash2 className="icon-small" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {isFormOpen && (
        <FormComponent
          isOpen={isFormOpen}
          onClose={() => setIsFormOpen(false)}
          onSubmit={handleFormSubmit}
          candidate={editingCandidate}
          mode={formMode}
        />
      )}

      {deleteConfirmOpen && (
        <div className="alert-dialog-backdrop">
          <div className="alert-dialog-content">
            <h3>Delete Candidate</h3>
            <p>Are you sure you want to delete this candidate? This action cannot be undone.</p>
            <div className="alert-dialog-actions">
              <button onClick={() => setDeleteConfirmOpen(false)} className="btn cancel-btn">
                Cancel
              </button>
              <button onClick={handleDeleteConfirm} className="btn delete-confirm-btn">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
