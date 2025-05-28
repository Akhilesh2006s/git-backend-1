const express = require('express');
const router = express.Router();
const { markStudentAttendance, getAttendanceByFaculty } = require('../controllers/attendanceController');

router.post('/mark-student-attendance', markStudentAttendance);
router.get('/faculty/:facultyId', getAttendanceByFaculty);

module.exports = router;
