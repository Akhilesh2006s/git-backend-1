const Attendance = require('../models/Attendance');

exports.getAttendanceByFaculty = async (req, res) => {
  try {
    const records = await Attendance.find({ facultyId: req.params.facultyId }).sort({ timestamp: -1 });
    res.json({ success: true, data: records });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching attendance' });
  }
};
