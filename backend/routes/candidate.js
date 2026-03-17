const express = require('express');
const Candidate = require('../models/Candidate');

const router = express.Router();


/* -----------------------------
   GET ALL CANDIDATES
------------------------------*/
router.get('/', async (req, res) => {

  try {

    const candidates = await Candidate.find({ status: "active" });

    res.status(200).json({
      success: true,
      candidates
    });

  } catch (error) {

    console.error("Fetch candidates error:", error);

    res.status(500).json({
      success: false,
      error: "Failed to fetch candidates"
    });

  }

});


/* -----------------------------
   CREATE CANDIDATE
------------------------------*/
router.post('/', async (req, res) => {

  try {

    const { name, party, age, position, description, image } = req.body;

    if (!name || !party || !position || !description) {
      return res.status(400).json({
        success: false,
        error: "Required fields missing"
      });
    }

    const candidate = new Candidate({
      name,
      party,
      position,
      description,
      age,
      image
    });

    const savedCandidate = await candidate.save();

    res.status(201).json({
      success: true,
      candidate: savedCandidate
    });

  } catch (error) {

    console.error("Create candidate error:", error);

    res.status(400).json({
      success: false,
      error: "Could not add candidate"
    });

  }

});


/* -----------------------------
   UPDATE CANDIDATE
------------------------------*/
router.patch('/:id', async (req, res) => {

  try {

    const updateFields = {};

    const allowedFields = [
      "name",
      "party",
      "position",
      "description",
      "age",
      "image",
      "status"
    ];

    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updateFields[field] = req.body[field];
      }
    });

    const candidate = await Candidate.findByIdAndUpdate(
      req.params.id,
      updateFields,
      { new: true }
    );

    if (!candidate) {
      return res.status(404).json({
        success: false,
        error: "Candidate not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Candidate updated successfully",
      candidate
    });

  } catch (error) {

    console.error("Update candidate error:", error);

    res.status(400).json({
      success: false,
      error: "Could not update candidate"
    });

  }

});


/* -----------------------------
   DELETE CANDIDATE
------------------------------*/
router.delete('/:id', async (req, res) => {

  try {

    const candidate = await Candidate.findByIdAndDelete(req.params.id);

    if (!candidate) {
      return res.status(404).json({
        success: false,
        error: "Candidate not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Candidate deleted"
    });

  } catch (error) {

    console.error("Delete candidate error:", error);

    res.status(400).json({
      success: false,
      error: "Could not delete candidate"
    });

  }

});


/* -----------------------------
   BULK UPLOAD CANDIDATES
------------------------------*/
router.post("/bulk-upload", async (req, res) => {

  try {

    const candidates = req.body.candidates;

    if (!Array.isArray(candidates) || candidates.length === 0) {
      return res.status(400).json({
        success: false,
        error: "No candidates provided"
      });
    }

    const validCandidates = candidates.map(c => ({
      name: c.name,
      party: c.party,
      position: c.position,
      description: c.description,
      age: c.age || null,
      image: c.image || "",
      status: c.status || "active",
      votes: 0
    }));

    const insertedCandidates = await Candidate.insertMany(validCandidates);

    res.status(201).json({
      success: true,
      message: `${insertedCandidates.length} candidates uploaded`,
      candidates: insertedCandidates
    });

  } catch (error) {

    console.error("Bulk upload error:", error);

    res.status(500).json({
      success: false,
      error: "Failed to upload candidates"
    });

  }

});


module.exports = router;