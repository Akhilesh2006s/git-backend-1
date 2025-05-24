require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const rateLimit = require("express-rate-limit");

const app = express();

// CORS Setup — Update origin in production
const corsOptions = {
    origin: process.env.FRONTEND_URL || "*",
    methods: ["GET", "POST", "DELETE"],
    allowedHeaders: ["Content-Type"],
    credentials: true,
};
app.use(cors(corsOptions));
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

// Mongoose Schemas and Models
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

const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    busRoute: { type: String, required: true },
    registeredAt: { type: Date, default: Date.now },
});
const User = mongoose.model("User", userSchema);

// Rate limiter (optional, recommended for production)
const scanLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 5,
    message: "❌ Too many scan attempts. Please try again later.",
});

// Routes
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

// Get latest GPS location
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

// Cleanup route — keep last 100 GPS entries
app.delete("/cleanup", async (req, res) => {
    try {
        const totalDocs = await GpsLocation.countDocuments();
        if (totalDocs > 100) {
            const toDelete = totalDocs - 100;
            const oldDocs = await GpsLocation.find().sort({ timestamp: 1 }).limit(toDelete).select("_id");
            const idsToDelete = oldDocs.map(doc => doc._id);
            await GpsLocation.deleteMany({ _id: { $in: idsToDelete } });
            console.log(`🗑 Deleted ${toDelete} old records`);
        }
        res.json({ message: "✅ Cleanup complete" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Record a student scan
app.post("/scan", scanLimiter, async (req, res) => {
    const { studentEmail } = req.body;

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

// Register a student to a bus route
app.post("/register", async (req, res) => {
    const { email, busRoute } = req.body;

    if (!email || !busRoute) {
        return res.status(400).json({ error: "❌ Email and busRoute are required" });
    }

    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: "❌ User already registered" });
        }

        const newUser = new User({ email, busRoute });
        await newUser.save();
        res.json({ message: "✅ User registered successfully", user: newUser });
    } catch (error) {
        console.error("❌ Registration error:", error);
        res.status(500).json({ error: error.message });
    }
});

// Faculty route — get all scans
app.get("/faculty/scans", async (req, res) => {
    try {
        const scans = await StudentScan.find().sort({ scannedAt: -1 }).lean();
        res.json(scans);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Optional: Health check route
app.get("/health", (req, res) => {
    const dbState = mongoose.connection.readyState;
    res.json({ mongoStatus: dbState }); // 1 = connected
});

// Start server
const PORT = process.env.PORT || 2000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
