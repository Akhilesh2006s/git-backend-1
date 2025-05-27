const Attendance = require('../models/Attendance');
const Student = require('../models/Student');
const Faculty = require('../models/Faculty');
const Bus = require('../models/Bus');

// Mark student attendance (used by faculty scanner)
exports.markStudentAttendance = async (req, res) => {
  try {
    const { barcode, timestamp } = req.body;
    
    // 1. Validate the student barcode
    const student = await Student.findOne({ barcode });
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found with this barcode'
      });
    }

    // 2. Get faculty info (from auth middleware)
    const faculty = req.user; // Assuming you have auth middleware
    
    // 3. Get bus info (assuming faculty is assigned to a bus)
    const bus = await Bus.findById(faculty.busId);
    if (!bus) {
      return res.status(400).json({
        success: false,
        message: 'Faculty not assigned to a valid bus'
      });
    }

    // 4. Create attendance record
    const attendance = new Attendance({
      student: student._id,
      faculty: faculty._id,
      bus: bus._id,
      timestamp: timestamp || new Date(),
      status: 'present'
    });

    await attendance.save();

    // 5. Return success response with student details
    res.status(201).json({
      success: true,
      message: 'Attendance recorded successfully',
      data: {
        name: student.name,
        regNo: student.regNo,
        timestamp: attendance.timestamp,
        busRoute: bus.routeName
      }
    });

  } catch (error) {
    console.error('Error recording attendance:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get attendance records for faculty dashboard
exports.getFacultyAttendanceRecords = async (req, res) => {
  try {
    const facultyId = req.params.facultyId;
    
    // Validate faculty exists
    const faculty = await Faculty.findById(facultyId);
    if (!faculty) {
      return res.status(404).json({
        success: false,
        message: 'Faculty not found'
      });
    }

    // Get attendance records with populated student and bus info
    const records = await Attendance.find({ faculty: facultyId })
      .populate('student', 'name regNo')
      .populate('bus', 'routeName')
      .sort({ timestamp: -1 }) // Newest first
      .limit(100); // Limit to 100 most recent

    // Format the response data
    const formattedRecords = records.map(record => ({
      id: record._id,
      studentName: record.student.name,
      regNo: record.student.regNo,
      timestamp: record.timestamp,
      busRoute: record.bus.routeName,
      status: record.status
    }));

    res.status(200).json({
      success: true,
      data: formattedRecords
    });

  } catch (error) {
    console.error('Error fetching attendance records:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Optional: Get today's attendance summary
exports.getTodaysSummary = async (req, res) => {
  try {
    const facultyId = req.params.facultyId;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const count = await Attendance.countDocuments({
      faculty: facultyId,
      timestamp: { $gte: today }
    });

    res.status(200).json({
      success: true,
      data: {
        count,
        date: today.toISOString()
      }
    });

  } catch (error) {
    console.error('Error fetching todays summary:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};