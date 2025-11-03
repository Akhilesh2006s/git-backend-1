const mongoose = require("mongoose");

const stopSchema = new mongoose.Schema({
    route: String,
    stopName: String,
    lat: Number,
    lon: Number,
    scheduledTime: String
});

// Explicitly set collection name to match MongoDB
module.exports = mongoose.model("RouteStop", stopSchema, "routestops");