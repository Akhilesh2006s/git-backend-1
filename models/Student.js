const mongoose = require('mongoose');

const StudentSchema = new mongoose.Schema({
    name: { type: String, required: true },
    regNo: { type: String, required: true, unique: true },
    barcode: { type: String, required: true, unique: true },
    routeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Route' },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Student', StudentSchema);