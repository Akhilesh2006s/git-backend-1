const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');
const authMiddleware = require('../middleware/auth');

// Faculty marks student attendance
router.post(
  '/mark-student-attendance',
  authMiddleware.facultyAuth, // Ensure only faculty can access
  attendanceController.markStudentAttendance
);

// Get faculty's attendance records
router.get(
  '/faculty/:facultyId',
  authMiddleware.facultyAuth,
  attendanceController.getFacultyAttendanceRecords
);

// Get today's summary (optional)
router.get(
  '/faculty/:facultyId/today',
  authMiddleware.facultyAuth,
  attendanceController.getTodaysSummary
);

module.exports = router;