// routes/attendance.js
const express = require("express");
const router = express.Router();
const attendanceController = require("../controllers/attendanceController");
const authMiddleware = require("../middlewares/authMiddleware");

// Mark student attendance
router.post(
  "/mark-student-attendance",
  authMiddleware,
  attendanceController.markStudentAttendance
);

// Get faculty attendance records
router.get(
  "/faculty/:facultyId",
  authMiddleware,
  attendanceController.getFacultyAttendanceRecords
);

module.exports = router;