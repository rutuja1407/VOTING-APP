const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({

  voterId: {
    type: String,
    required: [true, 'Voter ID is required'],
    unique: true,
    uppercase: true,
    trim: true,
    index: true,
  },

  name: {
    type: String,
    required: [true, 'Full name is required'],
    trim: true,
    minlength: 2,
    maxlength: 100
  },

  phone: {
    type: String,
    required: true,
    unique: true,
    index: true,
    validate: {
      validator: function (v) {
        return /^[6-9]\d{9}$/.test(v);
      },
      message: 'Invalid Indian mobile number'
    }
  },

  password: {
    type: String,
    required: true,
    minlength: 8
  },

  hasVoted: {
    type: Boolean,
    default: false,
    index: true
  },

  userType: {
    type: String,
    enum: ['voter', 'admin'],
    default: 'voter'
  },

  isActive: {
    type: Boolean,
    default: true
  },

  registrationDate: {
    type: Date,
    default: Date.now
  },

  votingDate: {
    type: Date,
    default: null
  },

  faceDescriptor: {
    type: [Number],
    required: true,
    validate: {
      validator: function (v) {
        return Array.isArray(v) && v.length === 128;
      },
      message: 'Face descriptor must contain 128 values'
    }
  },

  faceRegisteredAt: {
    type: Date,
    default: Date.now
  },
  isFaceRegistered: Boolean

}, {
  timestamps: true,
  collection: 'confirmed_voters'
});


/* -------------------------------
   Password Hashing Middleware
--------------------------------*/
userSchema.pre('save', async function (next) {

  if (!this.isModified('password')) return next();

  try {
    this.password = await bcrypt.hash(this.password, 10);
    next();
  } catch (error) {
    next(error);
  }

});


/* -------------------------------
   Compare Password Method
--------------------------------*/
userSchema.methods.comparePassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};


/* -------------------------------
   Public Profile (hide password)
--------------------------------*/
userSchema.virtual('publicProfile').get(function () {
  return {
    voterId: this.voterId,
    name: this.name,
    phone: this.phone,
    email: this.email,
    hasVoted: this.hasVoted,
    votingDate: this.votingDate
  };
});


const User = mongoose.model('User', userSchema);

module.exports = User;