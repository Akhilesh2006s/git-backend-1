const GpsLocation = require("../models/GpsLocation");

exports.updateLocation = async (req, res) => {
    const { lat, lon, route } = req.query;
    if (!lat || !lon || !route) return res.status(400).json({ error: "Missing lat, lon, or route" });

    try {
        const newLocation = new GpsLocation({ lat, lon, route });
        await newLocation.save();
        console.log(`[GPS API] New location saved - Route: ${route}, Lat: ${lat}, Lon: ${lon}, Time: ${newLocation.timestamp}`);
        res.json({ success: true, lat, lon, route });
    } catch (err) {
        console.error('[GPS API] Error saving location:', err);
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

exports.getAllLatestLocations = async (req, res) => {
    try {
        // Use aggregation to get the latest location for each route efficiently
        const locations = await GpsLocation.aggregate([
            {
                $sort: { timestamp: -1 }
            },
            {
                $group: {
                    _id: "$route",
                    lat: { $first: "$lat" },
                    lon: { $first: "$lon" },
                    route: { $first: "$route" },
                    stopName: { $first: "$stopName" },
                    timestamp: { $first: "$timestamp" }
                }
            },
            {
                $project: {
                    _id: 0,
                    lat: 1,
                    lon: 1,
                    route: 1,
                    stopName: 1,
                    timestamp: 1
                }
            }
        ]);
        
        console.log(`[GPS API] Returning ${locations.length} tracker locations:`, locations.map(l => l.route));
        
        res.json({ success: true, trackers: locations });
    } catch (err) {
        console.error('[GPS API] Error fetching all locations:', err);
        res.status(500).json({ error: err.message });
    }
};
