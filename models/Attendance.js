const mongoose = require('mongoose');

const AttendanceSchema = new mongoose.Schema({
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
    facultyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Faculty' },
    busId: { type: mongoose.Schema.Types.ObjectId, ref: 'Bus' },
    stopId: { type: mongoose.Schema.Types.ObjectId, ref: 'RouteStop' },
    timestamp: { type: Date, default: Date.now },
    type: { type: String, enum: ['student', 'faculty'], required: true }
});

module.exports = mongoose.model('Attendance', AttendanceSchema);