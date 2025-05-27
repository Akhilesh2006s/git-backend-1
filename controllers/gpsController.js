const GpsLocation = require("../models/GpsLocation");

exports.updateLocation = async (req, res) => {
    const { route, stopName, lat, lon, status } = req.body;
    if (!route || !stopName || !lat || !lon) {
        return res.status(400).json({ error: "Missing data" });
    }

    try {
        const log = new GpsLocation({ route, stopName, lat, lon, status }); // ✅ include status here
        await log.save();
        res.json({ success: true, stop: stopName, time: log.timestamp, status: log.status }); // ✅ optionally return it
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};


exports.getLatestLocation = async (req, res) => {
    try {
        const data = await GpsLocation.findOne({ route: req.params.route }).sort({ timestamp: -1 });
        res.json(data || {});
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};