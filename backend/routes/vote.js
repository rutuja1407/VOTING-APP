const express = require('express');
const User = require('../models/user');
const Candidate = require('../models/Candidate');
const router = express.Router();

router.patch("/", async (req, res) => { 
  const { aadhaar,candidateId } = req.body;
  
  try {
    // Find user by aadhaar
    const voter = await User.findOne({ aadhaar });

    if (!voter) {
      return res.status(404).json({ error: "User not found" });
    }

    if (voter.hasVoted) {
      return res.status(400).json({ error: "This Aadhaar has already voted." });
    }
    const updatedCandidate =  await Candidate.findByIdAndUpdate(
      candidateId,
      { $inc: { votes: 1 } },
      { new: true }
    )
    if (!updatedCandidate) {
      return res.status(404).json({ error: "Candidate not found" });
    }

    // Mark as voted and record when they voted
    voter.hasVoted = true;
    voter.votingDate = new Date();
    await voter.save();

    

    console.log('✅ Vote recorded for user:', voter.name);
    res.status(200).json({ 
      message: "Vote recorded successfully",
      user: {
        id: voter._id,
        name: voter.name,
        hasVoted: voter.hasVoted,
        votingDate: voter.votingDate
      }
    });
  } catch (error) {
    console.error('❌ Error recording vote:', error);
    res.status(500).json({ message: error.message });
  }
});


module.exports = router;
