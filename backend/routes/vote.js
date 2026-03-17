const express = require('express');
const User = require('../models/user');
const Candidate = require('../models/Candidate');

const router = express.Router();

/* -----------------------------
   CAST VOTE (SECURE VERSION)
------------------------------*/
router.patch("/", async (req, res) => {

  const { voterId, candidateId } = req.body;

  try {

    if (!voterId || !candidateId) {
      return res.status(400).json({
        success: false,
        error: "voterId and candidateId are required"
      });
    }

    // Check candidate first
    const candidate = await Candidate.findById(candidateId);

    if (!candidate) {
      return res.status(404).json({
        success: false,
        error: "Candidate not found"
      });
    }

    /* 
       ATOMIC UPDATE
       Only update voter if hasVoted = false
    */
    const voter = await User.findOneAndUpdate(
      { voterId, hasVoted: false },
      {
        hasVoted: true,
        votingDate: new Date()
      },
      { new: true }
    );

    if (!voter) {
      return res.status(400).json({
        success: false,
        error: "This voter has already voted or does not exist"
      });
    }

    // Increment vote count
    const updatedCandidate = await Candidate.findByIdAndUpdate(
      candidateId,
      { $inc: { votes: 1 } },
      { new: true }
    );

    console.log("✅ Vote recorded for:", voter.name);

    res.status(200).json({
      success: true,
      message: "Vote recorded successfully",
      voter: {
        id: voter._id,
        voterId: voter.voterId,
        name: voter.name,
        hasVoted: voter.hasVoted,
        votingDate: voter.votingDate
      },
      candidate: {
        id: updatedCandidate._id,
        name: updatedCandidate.name,
        votes: updatedCandidate.votes
      }
    });

  } catch (error) {

    console.error("❌ Vote recording error:", error);

    res.status(500).json({
      success: false,
      error: error.message
    });

  }

});

module.exports = router;