const mongoose = require("mongoose");

const stopSchema = new mongoose.Schema({
    route: String,
    stopName: String,
    lat: Number,
    lon: Number,
    scheduledTime: String,
    status: { type: String, default: "pending" } 

});

module.exports = mongoose.model("RouteStop", stopSchema);