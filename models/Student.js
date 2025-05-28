// dist/models/Student.js
const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  regNo: {
    type: String,
    required: true,
    unique: true,
    match: /^\d{2}[A-Z]{3}\d{4}$/ // Matches barcode format (e.g., 23BCE7426)
  },
  department: {
    type: String,
    required: true
  },
  batch: {
    type: String,
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model("Student", studentSchema);