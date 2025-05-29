const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
    regNo: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    department: { type: String, required: true },
    batch: String,
});

module.exports = mongoose.model('Student', studentSchema);