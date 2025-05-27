const mongoose = require('mongoose');

const facultySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  busId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Bus'
  },
  role: {
    type: String,
    default: 'faculty'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Faculty', facultySchema);