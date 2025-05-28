const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  regNo: String,
  facultyId: {
    type: String,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  status: {
    type: String,
    enum: ['present', 'absent', 'late'],
    default: 'present'
  },
  student: {
    name: String,
    regNo: String,
    department: String,
  }
});

module.exports = mongoose.model('Attendance', attendanceSchema);
