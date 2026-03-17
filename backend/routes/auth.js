const express = require('express');
const bcrypt = require('bcrypt');
const User = require('../models/user');
const Voter = require ('../models/voter')
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

    const { voterId, name, phone, email, password, faceDescriptor } = req.body;

    console.log("📝 Registration attempt:", voterId);

    /* Check duplicate voterId / email / phone */
    // Check duplicate face across database

  const existingUsers = await User.find({}, "faceDescriptor name");

  for (const user of existingUsers) {

    const distance = euclideanDistance(
      user.faceDescriptor,
      faceDescriptor
    );

    if (distance < 0.5) {

      console.log("Duplicate face detected:", user.name);

      return res.status(400).json({
        error: "Face already registered with another voter ID"
      });

    }

  }

    /* Create new user */
    const newUser = new User({
      voterId,
      name,
      phone,
      email,
      password,
      faceDescriptor,
      hasVoted: false,
      registrationDate: new Date()
    });

    const savedUser = await newUser.save();

    res.status(201).json({
      message: "User registered successfully!",
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
        error: `${field} already exists`
      });
    }

    res.status(500).json({ error: error.message });

  }

});

router.post("/save-voter-face", async (req, res) => {
  try {
    const { voterId, faceDescriptor } = req.body;

    if (!voterId || !faceDescriptor) {
      return res.status(400).json({ message: "Missing data" });
    }

    const voter = await Voter.default.findOneAndUpdate(
      { voterId },
      {
        faceDescriptor
      },
      { new: true }
    );

    if (!voter) {
      return res.status(404).json({ message: "Voter not found" });
    }

    res.json({ message: "Face descriptor saved" });
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