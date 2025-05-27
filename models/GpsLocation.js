const mongoose = require("mongoose");

const gpsSchema = new mongoose.Schema({
    route: String,
    lat: Number,
    lon: Number,
    stopName: String, // optional if only tracking
    status: String,
    timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model("GpsLocation", gpsSchema);