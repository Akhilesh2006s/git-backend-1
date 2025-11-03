const RouteStop = require("../models/RouteStop");
const GpsLocation = require("../models/GpsLocation");

exports.getStopsByRoute = async (req, res) => {
    try {
        console.log(`🔍 Searching for stops on route: ${req.params.route}`);
        const stops = await RouteStop.find({ route: req.params.route }).sort({ scheduledTime: 1 });
        console.log(`📊 Found ${stops.length} stops`);
        if (stops.length === 0) {
            // Let's check what routes exist in the database
            const allRoutes = await RouteStop.distinct("route");
            console.log(`📋 Available routes in DB:`, allRoutes);
        }
        res.json(stops);
    } catch (err) {
        console.error("❌ Error in getStopsByRoute:", err);
        res.status(500).json({ error: err.message });
    }
};

exports.logStopTime = async (req, res) => {
    const { route, stopName, lat, lon } = req.body;
    if (!route || !stopName || !lat || !lon) return res.status(400).json({ error: "Missing data" });

    try {
        const log = new GpsLocation({ route, stopName, lat, lon });
        await log.save();
        res.json({ success: true, stop: stopName, time: log.timestamp });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getRouteHistory = async (req, res) => {
    try {
        console.log(`🔍 Searching for history on route: ${req.params.route}`);
        const logs = await GpsLocation.find({ route: req.params.route, stopName: { $exists: true } }).sort({ timestamp: 1 });
        console.log(`📊 Found ${logs.length} history entries`);
        res.json(logs);
    } catch (err) {
        console.error("❌ Error in getRouteHistory:", err);
        res.status(500).json({ error: err.message });
    }
};