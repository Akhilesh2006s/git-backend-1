// dist/controllers/attendanceController.js
const Student = require("../models/Student");
const Attendance = require("../models/Attendance");
const Faculty = require("../models/Faculty");

exports.markStudentAttendance = async (req, res) => {
  try {
    const { barcode, facultyId, timestamp } = req.body;
    
    // Validate faculty
    const faculty = await Faculty.findById(facultyId);
    if (!faculty) {
      return res.status(404).json({ success: false, message: "Faculty not found" });
    }

    // Find student by barcode (registration number)
    const student = await Student.findOne({ regNo: barcode });
    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }

    // Check if attendance already recorded for today
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const existingAttendance = await Attendance.findOne({
      student: student._id,
      faculty: facultyId,
      timestamp: { $gte: todayStart, $lte: todayEnd }
    });

    if (existingAttendance) {
      return res.status(400).json({ 
        success: false, 
        message: "Attendance already recorded for this student today" 
      });
    }

    // Create new attendance record
    const attendance = new Attendance({
      student: student._id,
      faculty: facultyId,
      timestamp: timestamp || new Date(),
      status: "present"
    });

    await attendance.save();

    res.status(201).json({
      success: true,
      message: "Attendance recorded successfully",
      attendance,
      student: {
        name: student.name,
        regNo: student.regNo,
        department: student.department,
        batch: student.batch
      }
    });

  } catch (error) {
    console.error("Error marking attendance:", error);
    res.status(500).json({ 
      success: false, 
      message: "Internal server error",
      error: error.message 
    });
  }
};

exports.getFacultyAttendanceRecords = async (req, res) => {
  try {
    const { facultyId } = req.params;
    
    // Validate faculty
    const faculty = await Faculty.findById(facultyId);
    if (!faculty) {
      return res.status(404).json({ success: false, message: "Faculty not found" });
    }

    // Get attendance records with student details
    const records = await Attendance.find({ faculty: facultyId })
      .populate("student", "name regNo department")
      .sort({ timestamp: -1 });

    res.status(200).json({
      success: true,
      data: records.map(record => ({
        id: record._id,
        student: {
          name: record.student.name,
          regNo: record.student.regNo,
          department: record.student.department
        },
        timestamp: record.timestamp,
        status: record.status
      }))
    });

  } catch (error) {
    console.error("Error fetching attendance records:", error);
    res.status(500).json({ 
      success: false, 
      message: "Internal server error",
      error: error.message 
    });
  }
};