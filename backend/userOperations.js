const User = require('./models/user');


/* --------------------------------
   REGISTER USER
---------------------------------*/
const registerUser = async (userData) => {

  try {

    const newUser = new User(userData);

    const savedUser = await newUser.save();

    console.log("✅ User registered:", savedUser.voterId);

    return {
      success: true,
      user: {
        id: savedUser._id,
        voterId: savedUser.voterId,
        name: savedUser.name,
        email: savedUser.email
      }
    };

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


/* --------------------------------
   FIND USER BY VOTER ID
---------------------------------*/
const findUserByVoterId = async (voterId) => {

  try {

    const user = await User.findOne(
      { voterId },
      "-password"
    );

    return user;

  } catch (error) {

    console.error("Error finding user:", error);

    return null;

  }

};


/* --------------------------------
   MARK USER AS VOTED
---------------------------------*/
const markUserAsVoted = async (voterId) => {

  try {

    const user = await User.findOneAndUpdate(
      { voterId },
      {
        hasVoted: true,
        votingDate: new Date()
      },
      { new: true }
    );

    return user;

  } catch (error) {

    console.error("Error updating voting status:", error);

    return null;

  }

};


/* --------------------------------
   GET ALL USERS
---------------------------------*/
const getAllUsers = async () => {

  try {

    const users = await User.find(
      {},
      "-password"
    );

    return users;

  } catch (error) {

    console.error("Error fetching users:", error);

    return [];

  }

};


module.exports = {
  registerUser,
  findUserByVoterId,
  markUserAsVoted,
  getAllUsers
};