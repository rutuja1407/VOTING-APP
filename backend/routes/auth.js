const express = require('express');
const bcrypt = require('bcrypt');
const User = require('../models/user');
const Voter = require('../models/voter');
const router = express.Router();

/* ------------------------------
   Euclidean Distance Function
-------------------------------*/
function euclideanDistance(desc1, desc2) {

  let sum = 0;

  for (let i = 0; i < desc1.length; i++) {
    sum += (desc1[i] - desc2[i]) ** 2;
  }

  return Math.sqrt(sum);
}

/* --------------------------------
   REGISTER USER
---------------------------------*/
router.post('/register', async (req, res) => {
  try {
    const { voterId, name, phone, password, faceDescriptor } = req.body;

    console.log("📝 Registration attempt:", voterId);

    // ✅ 1. Check if voter exists (from seeded data)
    const existingVoter = await Voter.findOne({ voterId });

    if (!existingVoter) {
      return res.status(404).json({
        error: "Voter ID not found",
        success: false
      });
    }

    // ✅ 2. Check name match
    if (existingVoter.fullName.toLowerCase() !== name.toLowerCase()) {
      return res.status(400).json({
        error: "Name does not match voter ID",
        success: false
      });
    }

    // ✅ 3. Check if voter card face exists
    if (!existingVoter.faceDescriptor || existingVoter.faceDescriptor.length === 0) {
      return res.status(400).json({
        error: "Please upload voter ID card first",
        success: false
      });
    }

    // ✅ 4. Compare face with stored voter-card face
    const matchDistance = euclideanDistance(
      existingVoter.faceDescriptor,
      faceDescriptor
    );

    if (matchDistance > 0.5) {
      return res.status(400).json({
        error: "Face does not match voter ID card",
        success: false
      });
    }

    // ✅ 5. Check duplicate face across other users
    const allUsers = await User.find({ _id: { $ne: existingVoter._id } }, "faceDescriptor name");

    for (const user of allUsers) {
      if (!user.faceDescriptor || user.faceDescriptor.length === 0) continue;

      const distance = euclideanDistance(
        user.faceDescriptor,
        faceDescriptor
      );

      if (distance < 0.5) {
        return res.status(400).json({
          error: `Face already registered with another voter (${user.name})`,
          success: false
        });
      }
    }

    // ✅ 6. Update voter (DO NOT create new user ❗)
    const newUser = new User({
      voterId,
      name,
      phone,
      password,
      faceDescriptor,
      hasVoted: false,
      registrationDate: new Date()
    });
    const savedUser = await newUser.save();

    res.status(201).json({
      message: "User registered successfully!",
      success: true,
      user: {
        id: savedUser._id,
        voterId: savedUser.voterId,
        name: savedUser.name
      }
    });

  } catch (error) {
    console.error("❌ Registration error:", error);

    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern || {})[0];

      return res.status(400).json({
        error: `${field} already exists`,
        success: false
      });
    }

    res.status(500).json({ error: error.message, success: false });
  }
});

/* --------------------------------
   SAVE VOTER FACE DESCRIPTOR
---------------------------------*/

router.post("/save-voter-face", async (req, res) => {
  try {
    const { voterId, faceDescriptor } = req.body;

    if (!voterId || !faceDescriptor) {
      return res.status(400).json({ message: "Missing data" });
    }

    const voter = await Voter.findOneAndUpdate({
      voterId
    }, {
      faceDescriptor
    }, {
      new: true
    })

    if (!voter) {
      return res.status(404).json({ message: "Voter not found", success: false });
    }

    res.json({ message: "Face descriptor saved", success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});
/* --------------------------------
   LOGIN USER
---------------------------------*/
router.post('/login', async (req, res) => {

  try {

    const { voterId, password, loginDescriptor } = req.body;

    console.log("🔐 Login attempt:", voterId);

    const user = await User.findOne({
      $or: [
        { voterId },
        { email: voterId }
      ]
    });

    if (!user) {
      return res.status(401).json({
        error: "User not found"
      });
    }

    /* Check password */
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return res.status(401).json({
        error: "Invalid password"
      });
    }

    /* Face verification */
    const distance = euclidean(user.faceDescriptor, loginDescriptor);

    const threshold = 0.6;

    const match = distance < threshold;

    console.log("Face distance:", distance);

    res.json({
      message: "Login successful",
      user: {
        id: user._id,
        voterId: user.voterId,
        name: user.name,
        email: user.email,
        phone: user.phone,
        hasVoted: user.hasVoted,
        match
      }
    });

  } catch (error) {

    console.error("❌ Login error:", error);

    res.status(500).json({
      error: error.message
    });

  }

});


/* --------------------------------
   GET USER BY VOTER ID
---------------------------------*/
router.get('/voter/:voterId', async (req, res) => {

  try {

    const { voterId } = req.params;

    const user = await User.findOne({ voterId }, "-password");

    if (!user) {
      return res.status(404).json({
        error: "User not found"
      });
    }

    res.json({ user });

  } catch (error) {

    console.error("Fetch user error:", error);

    res.status(500).json({
      error: error.message
    });

  }

});

module.exports = router;