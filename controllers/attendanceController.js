const Attendance = require('../models/Attendance');
const Student = require('../models/Student');

const markAttendanceByBarcode = async (req, res) => {
  try {
    const { barcode } = req.body;
    const facultyId = req.user?.id; // From auth token

    if (!barcode) {
      return res.status(400).json({ success: false, message: 'Barcode is required' });
    }

    if (!facultyId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    // Clean and validate barcode format (e.g., 23BCE7426)
    const regNo = barcode.trim().toUpperCase();
    
    if (!/^\d{2}[A-Z]{3}\d{4}$/.test(regNo)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid student ID format' 
      });
    }

    // Verify student exists (but don't return their details)
    const studentExists = await Student.exists({ regNo });
    if (!studentExists) {
      return res.status(404).json({ 
        success: false, 
        message: 'Student ID not found' 
      });
    }

    // Create minimal attendance record
    const attendance = new Attendance({
      regNo,
      facultyId,
      timestamp: new Date(),
      status: 'present'
    });

    await attendance.save();

    res.status(201).json({
      success: true,
      message: 'Attendance recorded',
      regNo // Only return the ID back
    });

  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ 
      success: false, 
      message: 'Attendance recording failed' 
    });
  }
};

// Export only what's needed
module.exports = {
  markAttendanceByBarcode
};
