const User = require('../models/User');

// Register new user
const registerUser = async (userData) => {
  try {
    const { aadhar_number, full_name, phone_number, email_id, password, face_detected } = userData;
    
    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [
        { aadhar_number },
        { phone_number },
        { email_id }
      ]
    });
    
    if (existingUser) {
      let field = '';
      if (existingUser.aadhar_number === aadhar_number) field = 'Aadhaar number';
      else if (existingUser.phone_number === phone_number) field = 'Phone number';
      else if (existingUser.email_id === email_id) field = 'Email address';
      
      return {
        success: false,
        message: `${field} already registered`
      };
    }
    
    const newUser = new User({
      aadhar_number,
      full_name,
      phone_number,
      email_id,
      password,
      faceDescriptor: face_detected || false
    });
    
    const savedUser = await newUser.save();
    
    return {
      success: true,
      message: 'User registered successfully',
      user: savedUser.publicProfile
    };
    
  } catch (error) {
    console.error('Registration error:', error);
    return {
      success: false,
      message: 'Registration failed',
      error: error.message
    };
  }
};

// Login user
const loginUser = async (loginData) => {
  try {
    const { aadhar_number, password } = loginData;
    
    if (!aadhar_number || !password) {
      return {
        success: false,
        message: 'Please provide Aadhaar number and password'
      };
    }
    
    const user = await User.findOne({ aadhar_number });
    
    if (!user) {
      return {
        success: false,
        message: 'Invalid credentials'
      };
    }
    
    const isPasswordValid = await user.comparePassword(password);
    
    if (!isPasswordValid) {
      return {
        success: false,
        message: 'Invalid credentials'
      };
    }
    
    return {
      success: true,
      message: 'Login successful',
      user: user.publicProfile
    };
    
  } catch (error) {
    console.error('Login error:', error);
    return {
      success: false,
      message: 'Login failed',
      error: error.message
    };
  }
};

// Find user by Aadhaar
const findUserByAadhar = async (aadharNumber) => {
  try {
    const user = await User.findOne({ aadhar_number: aadharNumber }, '-password');
    
    if (!user) {
      return {
        success: false,
        message: 'User not found'
      };
    }
    
    return {
      success: true,
      user: user.publicProfile
    };
    
  } catch (error) {
    console.error('Find user error:', error);
    return {
      success: false,
      message: 'Failed to fetch user',
      error: error.message
    };
  }
};

// Mark user as voted
const markUserAsVoted = async (aadharNumber) => {
  try {
    const user = await User.findOne({ aadhar_number: aadharNumber });
    
    if (!user) {
      return {
        success: false,
        message: 'User not found',
        statusCode: 404
      };
    }
    
    if (user.has_voted) {
      return {
        success: false,
        message: 'User has already voted',
        statusCode: 400
      };
    }
    
    await user.markAsVoted();
    
    return {
      success: true,
      message: 'Vote recorded successfully',
      user: {
        aadhar_number: user.aadhar_number,
        full_name: user.full_name,
        has_voted: user.has_voted,
        votingDate: user.votingDate
      }
    };
    
  } catch (error) {
    console.error('Vote recording error:', error);
    return {
      success: false,
      message: 'Failed to record vote',
      error: error.message
    };
  }
};

// Get all users with pagination
const getAllUsers = async (options = {}) => {
  try {
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = options;
    
    const skip = (page - 1) * limit;
    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };
    
    const users = await User.find({}, '-password')
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean();
    
    const totalUsers = await User.countDocuments();
    const stats = await User.getVotingStats();
    
    return {
      success: true,
      pagination: {
        current_page: page,
        total_pages: Math.ceil(totalUsers / limit),
        total_users: totalUsers,
        users_per_page: limit
      },
      statistics: stats,
      users
    };
    
  } catch (error) {
    console.error('Fetch users error:', error);
    return {
      success: false,
      message: 'Failed to fetch users',
      error: error.message
    };
  }
};

// Update face detection
const updateFaceDetection = async (aadharNumber, faceDetected) => {
  try {
    const user = await User.findOneAndUpdate(
      { aadhar_number: aadharNumber },
      { face_detected: faceDetected },
      { new: true, select: '-password' }
    );
    
    if (!user) {
      return {
        success: false,
        message: 'User not found',
        statusCode: 404
      };
    }
    
    return {
      success: true,
      message: 'Face detection status updated',
      user: user.publicProfile
    };
    
  } catch (error) {
    console.error('Face detection update error:', error);
    return {
      success: false,
      message: 'Failed to update face detection status',
      error: error.message
    };
  }
};

// Get voting statistics
const getVotingStatistics = async () => {
  try {
    return await User.getVotingStats();
  } catch (error) {
    console.error('Statistics error:', error);
    throw error;
  }
};

module.exports = {
  registerUser,
  loginUser,
  findUserByAadhar,
  markUserAsVoted,
  getAllUsers,
  updateFaceDetection,
  getVotingStatistics
};
