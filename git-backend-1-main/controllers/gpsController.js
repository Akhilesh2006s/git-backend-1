const GpsLocation = require("../models/GpsLocation");

exports.updateLocation = async (req, res) => {
    const { lat, lon, route } = req.query;
    if (!lat || !lon || !route) return res.status(400).json({ error: "Missing lat, lon, or route" });

    try {
        const newLocation = new GpsLocation({ lat, lon, route });
        await newLocation.save();
        res.json({ success: true, lat, lon, route });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getLatestLocation = async (req, res) => {
    try {
        console.log(`🔍 Searching for route: ${req.params.route}`);
        const data = await GpsLocation.findOne({ route: req.params.route }).sort({ timestamp: -1 });
        console.log(`📊 Found data:`, data ? "Yes" : "No");
        if (!data) {
            console.log(`⚠️ No data found for route: ${req.params.route}`);
            // Let's check what routes exist in the database
            const allRoutes = await GpsLocation.distinct("route");
            console.log(`📋 Available routes in DB:`, allRoutes);
        }
        res.json(data || {});
    } catch (err) {
        console.error("❌ Error in getLatestLocation:", err);
        res.status(500).json({ error: err.message });
    }
};