const mongoose = require('mongoose');

const candidateSchema = new mongoose.Schema({
  name: { type: String, required: true },
  party: { type: String, required: true },
  position: { type: String, required: true },
  image: { type: String, required: false },
  description: { type: String, required: true }, 
  votes : { type: Number, default: 0 },
  age: { type: String, required: false },
  status:{type: String, default: 'active'} // active, inactive
});

module.exports = mongoose.model('Candidate', candidateSchema);
