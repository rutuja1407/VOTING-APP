const express = require('express');
const bcrypt = require('bcrypt');
const User = require('../models/user');
const Voter = require('../models/Voter');
const router = express.Router();
// Register user (stores faceDescriptor)
// import * as faceapi from 'face-api.js';
// Euclidean distance function for face descriptor comparison
function euclidean(a, b) {
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    sum += Math.pow(a[i] - b[i], 2);
  }
  return Math.sqrt(sum);
}



// Utility to compute Euclidean distance between two face descriptors
const calculateDistance = (desc1, desc2) => {
  if (!desc1 || !desc2) return Infinity;
  let sum = 0;
  for (let i = 0; i < desc1.length; i++) {
    sum += Math.pow(desc1[i] - desc2[i], 2);
  }
  return Math.sqrt(sum);
};

router.post('/register', async (req, res) => {
  try {
    const { aadhaar, name, phone, email, password, faceDescriptor } = req.body;
    console.log('📝 Registration attempt for:', name, 'Aadhaar:', aadhaar);

    // Aadhaar validation
    const voter = await Voter.findOne({ aadhaar });
    if (!voter) {
      return res.status(400).json({ error: "Aadhaar is not in voter list." });
    }

    // Duplicate Aadhaar, email, and phone validations
    const existingUser = await User.findOne({ aadhaar });
    if (existingUser) return res.status(400).json({ error: "Aadhaar already registered." });

    const duplicateEmail = await User.findOne({ email });
    if (duplicateEmail) return res.status(400).json({ error: "Email already registered." });

    const duplicatePhone = await User.findOne({ phone });
    if (duplicatePhone) return res.status(400).json({ error: "Phone number already registered." });

    // ✅ Face duplicate check
    const allUsers = await User.find({}, { faceDescriptor: 1, name: 1, _id: 0 });
    for (let user of allUsers) {
      const distance = calculateDistance(faceDescriptor, user.faceDescriptor);
      if (distance < 0.45) { // Threshold, can be adjusted based on model accuracy
        console.log('❌ Face already exists, matching user:', user.name);
        return res.status(400).json({ error: "Face already exists in the system." });
      }
    }

    // Continue registration
    const newUser = new User({
      aadhaar,
      name,
      phone,
      email,
      password,
      hasVoted: false,
      faceDescriptor,
      registrationDate: new Date(),
    });

    const savedUser = await newUser.save();

    res.status(201).json({
      message: "User registered successfully!",
      userId: savedUser._id,
      name: savedUser.name,
    });

  } catch (error) {
    console.error('❌ Registration error:', error);
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern || {})[0];
      return res.status(400).json({
        error: `${field} already exists. Please use a different ${field}`
      });
    }
    res.status(500).json({ error: error.message });
  }
});


// Login user with faceDescriptor check
router.post('/login', async (req, res) => {
  try {
    const { userId, password, loginDescriptor } = req.body;
    console.log('🔐 Login attempt for:', userId);

    // Find user by aadhaar or email
    const user = await User.findOne({
      $or: [{ aadhaar: userId }, { email: userId }]
    });

    if (!user) {
      console.log('❌ User not found:', userId);
      return res.status(401).json({ error: "User not found" });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(
      password,
      user.password
    );
    if (!isValidPassword) {
      console.log('❌ Invalid password for:', userId);
      return res.status(401).json({ error: "Invalid password" });
    }

    // Euclidean distance between stored and login face descriptor
    const distance = euclidean(user.faceDescriptor, loginDescriptor);
    const threshold = 0.6; // Typical threshold for face-api.js face descriptors
    const match = distance < threshold;

    console.log(`Distance: ${distance}, face match? ${match}`);

    res.json({
      message: "Login successful",
      user: {
        id: user._id,
        aadhaar: user.aadhaar,
        name: user.name,
        email: user.email,
        hasVoted: user.hasVoted,
        phone: user.phone,
        match
      }
    });
  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/aadhaar/:aadhaar',async(req,res)=>{
 
  
  const {aadhaar} = req.params
  try {
    const user = await User.findOne({
      aadhaar
    })

    return res.status(200).json({user})
  } catch (error) {    
    console.log("Error fetching user",error);
    
  }
})

module.exports = router;