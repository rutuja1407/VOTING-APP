const User = require('./models/User');

// Function to register a new user
const registerUser = async (userData) => {
  try {
    const newUser = new User(userData);
    const savedUser = await newUser.save();
    console.log('User registered successfully:', savedUser._id);
    return { success: true, user: savedUser };
  } catch (error) {
    if (error.code === 11000) {
      const duplicateField = Object.keys(error.keyPattern)[0];
      return { 
        success: false, 
        error: `${duplicateField} already exists` 
      };
    }
    return { 
      success: false, 
      error: error.message 
    };
  }
};

// Function to find user by Aadhaar number
const findUserByAadhar = async (aadharNumber) => {
  try {
    const user = await User.findOne({ aadhar_number: aadharNumber });
    return user;
  } catch (error) {
    console.error('Error finding user:', error);
    return null;
  }
};

// Function to update voting status
const markUserAsVoted = async (aadharNumber) => {
  try {
    const user = await User.findOneAndUpdate(
      { aadhar_number: aadharNumber },
      { has_voted: true },
      { new: true }
    );
    return user;
  } catch (error) {
    console.error('Error updating voting status:', error);
    return null;
  }
};

// Function to get all users
const getAllUsers = async () => {
  try {
    const users = await User.find({}, '-password'); // Exclude password field
    return users;
  } catch (error) {
    console.error('Error fetching users:', error);
    return [];
  }
};

module.exports = {
  registerUser,
  findUserByAadhar,
  markUserAsVoted, 
  getAllUsers
};
