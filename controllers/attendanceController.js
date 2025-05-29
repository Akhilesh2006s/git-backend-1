const Attendance = require('../models/Attendance');
const Student = require('../models/Student');

const markStudentAttendance = async (req, res) => {
  // Dummy for manual mark route (can be updated later)
  res.json({ success: true, message: "Manual mark logic here." });
};

const getAttendanceByFaculty = async (req, res) => {
  try {
    const records = await Attendance.find({ facultyId: req.params.facultyId }).sort({ timestamp: -1 });
    res.json({ success: true, data: records });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching attendance' });
  }
};

const markAttendanceByBarcode = async (req, res) => {
  try {
    const { barcode, timestamp } = req.body;
    const facultyId = req.user?.id || req.body.facultyId; // fallback if you're not using auth middleware

    if (!barcode || !facultyId) {
      return res.status(400).json({ success: false, message: 'Barcode or facultyId missing' });
    }

    const student = await Student.findOne({ regNo: barcode });
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    const attendance = new Attendance({
      regNo: barcode,
      timestamp,
      status: 'present',
      student: {
        name: student.name,
        regNo: student.regNo,
        department: student.department
      }
    });

    await attendance.save();

    res.status(201).json({
      success: true,
      message: 'Attendance marked successfully',
      attendance,
      student
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = {
  markStudentAttendance,
  getAttendanceByFaculty,
  markAttendanceByBarcode
};