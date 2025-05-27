const express = require('express');
const router = express.Router();
const Student = require('../models/Student');
const Faculty = require('../models/Faculty');
const Attendance = require('../models/Attendance');

// Mark student attendance
router.post('/mark-student-attendance', async (req, res) => {
    try {
        const { barcode, busId, stopId } = req.body;
        
        // Find student by barcode
        const student = await Student.findOne({ barcode });
        
        if (!student) {
            return res.status(404).json({ success: false, message: "Student not found" });
        }

        // Create attendance record
        const attendance = new Attendance({
            studentId: student._id,
            busId,
            stopId,
            timestamp: new Date(),
            type: 'student'
        });

        await attendance.save();

        res.json({ 
            success: true,
            message: "Attendance marked successfully",
            data: {
                name: student.name,
                regNo: student.regNo,
                stop: stopId,
                time: attendance.timestamp
            }
        });

    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Mark faculty attendance
router.post('/mark-faculty-attendance', async (req, res) => {
    try {
        const { barcode, busId } = req.body;
        
        // Find faculty by barcode
        const faculty = await Faculty.findOne({ barcode });
        
        if (!faculty) {
            return res.status(404).json({ success: false, message: "Faculty not found" });
        }

        // Create attendance record
        const attendance = new Attendance({
            facultyId: faculty._id,
            busId,
            timestamp: new Date(),
            type: 'faculty'
        });

        await attendance.save();

        res.json({ 
            success: true,
            message: "Attendance marked successfully",
            data: {
                name: faculty.name,
                employeeId: faculty.employeeId,
                time: attendance.timestamp
            }
        });

    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;