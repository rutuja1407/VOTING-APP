const express = require('express');
const Candidate = require('../models/Candidate');
const router = express.Router();

router.get('/', async (req, res) => {
    try {
      const candidates = await Candidate.find({});

      res.status(200).json({
        success: true,
         candidates,
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch candidates' });
    }
});
router.post('/', async (req, res) => {
    const { name, party, age, position,description,image } = req.body;
    try {
      const candidate = new Candidate({ name, party, position,description,age,image });
      await candidate.save();
      res.status(201).json({
        success: true,
        candidate,
      });
    } catch (error) {
      res.status(400).json({ error: 'Could not add candidate' });
    }
  });

router.patch('/:id', async (req, res) => {

  const { name, party, age, position,description,image,status } = req.body;
    try {
      const candidate = await Candidate.findByIdAndUpdate(req.params.id, {
        name, 
        party, 
        position,
        description,
        age,
        image,
        status
      }, { new: true });
      console.log('Updated candidate:', candidate);
      res.status(200).json({
        message:"Candidate updated successfully",
        success: true,
        candidate,
      });

    } catch (error) {
      res.status(400).json({ error: 'Could not update candidate' });
    }
  });
  
  // Delete candidate by id
router.delete('/:id', async (req, res) => {
    try {
      await Candidate.findByIdAndDelete(req.params.id);
      res.status(200).json({ message: "Deleted",success:true });
    } catch (error) {
      res.status(400).json({ error: 'Could not delete candidate' });
    }
});
  
router.post("/bulk-upload", async (req, res) => {
  try {
    const candidates = req.body.candidates;

    if (!Array.isArray(candidates) || candidates.length === 0) {
      return res.status(400).json({ error: "No candidates provided" });
    }

    // Optional: sanitize and validate
    const validCandidates = candidates.map((c) => ({
      name: c.name,
      age: c.age || "",
      party: c.party,
      position: c.position,
      image: c.image || "",
      description: c.description,
      status: c.status || "active",
      votes: c.votes || 0,
    }));

    // Insert into DB
    const inserted = await Candidate.insertMany(validCandidates);

    res.status(201).json({
      message: `${inserted.length} candidates successfully uploaded.`,
      candidates: inserted,
    });
  } catch (err) {
    console.error("Bulk upload error:", err);
    res.status(500).json({ error: "Failed to upload candidates." });
  }
});
module.exports = router;