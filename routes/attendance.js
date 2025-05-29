const express = require('express');
const router = express.Router();
const {
    markStudentAttendance,
    getAttendanceByFaculty,
    markAttendanceByBarcode
} = require('../controllers/attendanceController');

router.post('/mark-student-attendance', markStudentAttendance);
router.get('/faculty/:facultyId', getAttendanceByFaculty);

// ✅ This must be added
router.post('/scan', markAttendanceByBarcode);

module.exports = router;