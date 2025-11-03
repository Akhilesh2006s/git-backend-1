const mongoose = require("mongoose");

const gpsSchema = new mongoose.Schema({
    route: String,
    lat: Number,
    lon: Number,
    stopName: String, // optional if only tracking
    timestamp: { type: Date, default: Date.now }
});

// Explicitly set collection name to match MongoDB
module.exports = mongoose.model("GpsLocation", gpsSchema, "gpslocations");