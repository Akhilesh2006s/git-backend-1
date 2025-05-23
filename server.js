require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const app = express();

// CORS Setup — be careful with origin: "*" in production, restrict it accordingly
const corsOptions = {
    origin: "*", // TODO: change this in production to your frontend URL
    methods: ["GET", "POST", "DELETE"],
    allowedHeaders: ["Content-Type"],
};
app.use(cors(corsOptions));

// Middleware to parse JSON bodies
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => {
    console.log("✅ Connected to MongoDB");
}).catch((err) => {
    console.error("❌ MongoDB Connection Error:", err);
    process.exit(1);
});

// Define Mongoose schemas and models

const gpsSchema = new mongoose.Schema({
    lat: { type: Number, required: true },
    lon: { type: Number, required: true },
    timestamp: { type: Date, default: Date.now },
});
const GpsLocation = mongoose.model("GpsLocation", gpsSchema);

const scanSchema = new mongoose.Schema({
    studentEmail: { type: String, required: true },
    scannedAt: { type: Date, default: Date.now },
});
const StudentScan = mongoose.model("StudentScan", scanSchema);

// Routes

// Root route
app.get("/", (req, res) => {
    res.json({ message: "🟢 GPS Tracker + Scanner Backend Running" });
});

// Save GPS location
app.get("/update_location", async (req, res) => {
    let { lat, lon } = req.query;
    lat = parseFloat(lat);
    lon = parseFloat(lon);

    if (isNaN(lat) || isNaN(lon)) {
        return res.status(400).json({ error: "❌ Invalid latitude or longitude" });
    }

    try {
        const newLocation = new GpsLocation({ lat, lon });
        await newLocation.save();
        console.log(`📡 Location Saved: Lat=${lat}, Lon=${lon}`);
        res.json({ success: true, message: "✅ Data Received", lat, lon });
    } catch (error) {
        console.error("❌ Error saving location:", error);
        res.status(500).json({ error: error.message });
    }
});

// Get latest location
app.get("/get_location", async (req, res) => {
    try {
        const lastLocation = await GpsLocation.findOne().sort({ timestamp: -1 }).lean();
        res.json(lastLocation || { lat: 0, lon: 0 });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get all locations
app.get("/get_all_locations", async (req, res) => {
    try {
        const allLocations = await GpsLocation.find().sort({ timestamp: -1 }).lean();
        res.json(allLocations);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete old data — Keep only last 100 GPS location docs
app.delete("/cleanup", async (req, res) => {
    try {
        const totalDocs = await GpsLocation.countDocuments();
        if (totalDocs > 100) {
            const toDelete = totalDocs - 100;
            // Delete oldest documents (sort ascending by timestamp) — mongoose deleteMany + limit is tricky,
            // so use a workaround with find ids and deleteMany with _id: {$in: ids}
            const oldDocs = await GpsLocation.find().sort({ timestamp: 1 }).limit(toDelete).select("_id");
            const idsToDelete = oldDocs.map(doc => doc._id);
            await GpsLocation.deleteMany({ _id: { $in: idsToDelete } });
            console.log(`🗑️ Deleted ${toDelete} old records`);
        }
        res.json({ message: "✅ Cleanup complete" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Record student scan
// In your /scan route
app.post("/scan", async (req, res) => {
    const { studentEmail } = req.body;

    // Validate email pattern: name.rollnumber@vitapstudent.ac.in
    const emailPattern = /^[a-z]+\.[0-9]{2}[a-z]{2,3}[0-9]+@vitapstudent\.ac\.in$/i;
    
    if (!studentEmail || !emailPattern.test(studentEmail)) {
        return res.status(400).json({ 
            error: "❌ Invalid student email. Must be in format: name.rollnumber@vitapstudent.ac.in" 
        });
    }

    try {
        const scan = new StudentScan({ studentEmail });
        await scan.save();
        res.json({ message: "✅ Scan recorded successfully", scan });
    } catch (error) {
        console.error("❌ Scan save error:", error);
        res.status(500).json({ error: error.message });
    }
});

// Faculty route: get all scans
app.get("/faculty/scans", async (req, res) => {
    try {
        const scans = await StudentScan.find().sort({ scannedAt: -1 }).lean();
        res.json(scans);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Start server
const PORT = process.env.PORT || 2000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
