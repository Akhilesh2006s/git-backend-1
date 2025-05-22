require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const app = express();

// ✅ Enable CORS for frontend & ESP32 requests
const corsOptions = {
    origin: "*",
    methods: ["GET", "POST", "DELETE"],
    allowedHeaders: ["Content-Type"]
};
app.use(cors(corsOptions));
app.use(express.json());

// ✅ Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log("✅ Connected to MongoDB");
}).catch((err) => {
    console.error("❌ MongoDB Connection Error:", err);
    process.exit(1);
});

// ✅ Define GPS Location Schema
const gpsSchema = new mongoose.Schema({
    lat: { type: Number, required: true },
    lon: { type: Number, required: true },
    timestamp: { type: Date, default: Date.now }
});
const GpsLocation = mongoose.model("GpsLocation", gpsSchema);

// ✅ Profile Image Upload Setup
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        const baseName = path.basename(file.originalname, ext);
        cb(null, baseName + '-' + Date.now() + ext);
    }
});
const upload = multer({ storage });

// ✅ Serve profile images statically
app.use('/uploads', express.static(uploadDir));

// ✅ Upload profile image endpoint
app.post('/upload-profile-image', upload.single('profileImage'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: '❌ No file uploaded' });
    }
    const imageUrl = `http://localhost:${PORT}/uploads/${req.file.filename}`;
    res.json({ success: true, imageUrl });
});

// ✅ Test API
app.get("/", (req, res) => {
    res.json({ message: "🟢 GPS Tracker Backend with Profile Upload Running!" });
});

// ✅ Save GPS Location (ESP32)
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
        console.error("❌ MongoDB Error:", error);
        res.status(500).json({ error: error.message });
    }
});

// ✅ Get Latest GPS Location
app.get("/get_location", async (req, res) => {
    try {
        const lastLocation = await GpsLocation.findOne().sort({ timestamp: -1 }).lean();
        res.json(lastLocation || { lat: 0, lon: 0 });
    } catch (error) {
        console.error("❌ MongoDB Error:", error);
        res.status(500).json({ error: error.message });
    }
});

// ✅ Get All GPS Locations (Route History)
app.get("/get_all_locations", async (req, res) => {
    try {
        const allLocations = await GpsLocation.find().sort({ timestamp: -1 }).lean();
        res.json(allLocations);
    } catch (error) {
        console.error("❌ MongoDB Error:", error);
        res.status(500).json({ error: error.message });
    }
});

// ✅ Delete Old GPS Data (Keep Last 100 Entries)
app.delete("/cleanup", async (req, res) => {
    try {
        const totalDocs = await GpsLocation.countDocuments();
        if (totalDocs > 100) {
            const oldestEntries = await GpsLocation.find().sort({ timestamp: 1 }).limit(totalDocs - 100);
            const idsToDelete = oldestEntries.map(doc => doc._id);
            await GpsLocation.deleteMany({ _id: { $in: idsToDelete } });
            console.log(`🗑️ Deleted ${totalDocs - 100} old records`);
        }
        res.json({ message: "✅ Cleanup done if necessary" });
    } catch (error) {
        console.error("❌ MongoDB Cleanup Error:", error);
        res.status(500).json({ error: error.message });
    }
});

// ✅ Start the Server
const PORT = process.env.PORT || 2000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
