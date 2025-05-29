const express = require('express');
const router = express.Router();
const Student = require('../models/Student');

// 📌 POST /api/students/add
router.post('/add', async (req, res) => {
    try {
        const { regNo, name, department, batch } = req.body;

        // Validation
        if (!regNo || !name || !department) {
            return res.status(400).json({ success: false, message: 'Missing required fields' });
        }

        // Check for existing student
        const existing = await Student.findOne({ regNo });
        if (existing) {
            return res.status(409).json({ success: false, message: 'Student already exists' });
        }

        const student = new Student({ regNo, name, department, batch });
        await student.save();

        res.status(201).json({ success: true, message: 'Student added', student });
    } catch (error) {
        console.error('Add student error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;