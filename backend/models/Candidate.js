const mongoose = require('mongoose');

const candidateSchema = new mongoose.Schema(
{
  name: {
    type: String,
    required: true,
    trim: true
  },

  party: {
    type: String,
    required: true,
    trim: true
  },

  position: {
    type: String,
    required: true,
    trim: true
  },

  image: {
    type: String,
    default: ""
  },

  description: {
    type: String,
    required: true,
    trim: true
  },

  age: {
    type: Number,
    min: 18,
    required: false
  },

  votes: {
    type: Number,
    default: 0,
    index: true
  },

  status: {
    type: String,
    enum: ["active", "inactive"],
    default: "active"
  }

},
{
  timestamps: true,
  collection: "candidates"
}
);

module.exports = mongoose.model("Candidate", candidateSchema);