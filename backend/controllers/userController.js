const User = require('../models/user');
const bcrypt = require('bcrypt');

function euclideanDistance(desc1, desc2) {
  let sum = 0;
  for (let i = 0; i < desc1.length; i++) {
    sum += (desc1[i] - desc2[i]) ** 2;
  }
  return Math.sqrt(sum);
}


const registerUser = async (userData) => {
  try {
    const { voterId, name, phone, password, faceDescriptor } = userData;

    if (!voterId || !name || !phone ||!password || !faceDescriptor) {
      return {
        success: false,
        message: 'All fields are required'
      };
    }

    /* Check duplicate voterId / phone / email */
    const existingUser = await User.findOne({
      $or: [
        { voterId },
        { phone }
      ]
    });

    if (existingUser) {
      let field = '';
      if (existingUser.voterId === voterId) field = 'Voter ID';
      else if (existingUser.phone === phone) field = 'Phone number';

      return {
        success: false,
        message: `${field} already registered`
      };
    }

    /* Duplicate face detection */
    const users = await User.find({}, 'faceDescriptor');

    for (const user of users) {
      const distance = euclideanDistance(user.faceDescriptor, faceDescriptor);

      if (distance < 0.5) {
        return {
          success: false,
          message: 'Duplicate voter detected. Face already registered.'
        };
      }
    }

    const newUser = new User({
      voterId,
      name,
      phone,
      password,
      faceDescriptor
    });

    const savedUser = await newUser.save();

    return {
      success: true,
      message: 'User registered successfully',
      user: {
        voterId: savedUser.voterId,
        name: savedUser.name,
        phone: savedUser.phone,
  
      }
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


const loginUser = async (loginData) => {
  try {
    const { voterId, password } = loginData;

    if (!voterId || !password) {
      return {
        success: false,
        message: 'Please provide voter ID and password'
      };
    }

    const user = await User.findOne({ voterId });

    if (!user) {
      return {
        success: false,
        message: 'Invalid credentials'
      };
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return {
        success: false,
        message: 'Invalid credentials'
      };
    }

    return {
      success: true,
      message: 'Login successful',
      user: {
        voterId: user.voterId,
        name: user.name,
        phone: user.phone,
        hasVoted: user.hasVoted
      }
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

const findUserByVoterId = async (voterId) => {
  try {

    const user = await User.findOne({ voterId }, '-password');

    if (!user) {
      return {
        success: false,
        message: 'User not found'
      };
    }

    return {
      success: true,
      user
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

const markUserAsVoted = async (voterId) => {
  try {

    const user = await User.findOne({ voterId });

    if (!user) {
      return {
        success: false,
        message: 'User not found',
        statusCode: 404
      };
    }

    if (user.hasVoted) {
      return {
        success: false,
        message: 'User has already voted',
        statusCode: 400
      };
    }

    user.hasVoted = true;
    user.votingDate = new Date();

    await user.save();

    return {
      success: true,
      message: 'Vote recorded successfully',
      user: {
        voterId: user.voterId,
        name: user.name,
        hasVoted: user.hasVoted,
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


const getAllUsers = async (options = {}) => {
  try {

    const { page = 1, limit = 10 } = options;

    const skip = (page - 1) * limit;

    const users = await User.find({}, '-password')
      .skip(skip)
      .limit(limit)
      .lean();

    const totalUsers = await User.countDocuments();

    return {
      success: true,
      pagination: {
        current_page: page,
        total_pages: Math.ceil(totalUsers / limit),
        total_users: totalUsers
      },
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



const getVotingStatistics = async () => {
  try {

    const totalVoters = await User.countDocuments();
    const voted = await User.countDocuments({ hasVoted: true });

    return {
      totalVoters,
      voted,
      remaining: totalVoters - voted
    };

  } catch (error) {
    console.error('Statistics error:', error);
    throw error;
  }
};


module.exports = {
  registerUser,
  loginUser,
  findUserByVoterId,
  markUserAsVoted,
  getAllUsers,
  getVotingStatistics
};