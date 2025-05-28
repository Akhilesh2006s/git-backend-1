const RouteStop = require("../models/RouteStops");

exports.getStopsByRoute = async (req, res) => {
    try {
        const stops = await RouteStop.find({ route: req.params.route }).sort("time");
        res.json(stops);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};