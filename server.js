require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const fileUpload = require("express-fileupload");
const path = require("path");
const fs = require("fs");

const app = express();

// ✅ Middleware
app.use(cors({ origin: "*", methods: ["GET", "POST"], allowedHeaders: ["Content-Type"] }));
app.use(express.json());
app.use(fileUpload());

// ✅ Serve uploaded images
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}
app.use('/uploads', express.static(uploadDir));

// ✅ MongoDB Connection
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log("✅ Connected to MongoDB");
}).catch((err) => {
    console.error("❌ MongoDB Connection Error:", err);
    process.exit(1);
});

// ✅ GPS Schema
const gpsSchema = new mongoose.Schema({
    lat: { type: Number, required: true },
    lon: { type: Number, required: true },
    timestamp: { type: Date, default: Date.now }
});
const GpsLocation = mongoose.model("GpsLocation", gpsSchema);

// ✅ Profile Schema
const userSchema = new mongoose.Schema({
    name: String,
    email: { type: String, unique: true },
    profilePic: String // image path
});
const User = mongoose.model("User", userSchema);

// ✅ Root API
app.get("/", (req, res) => {
    res.json({ message: "🟢 GPS Tracker + Profile Upload Backend Running" });
});

// ✅ Upload Profile Photo
app.post("/upload_profile", async (req, res) => {
    try {
        const { name, email } = req.body;

        if (!req.files || !req.files.profilePic) {
            return res.status(400).json({ error: "❌ No profile picture uploaded" });
        }

        const image = req.files.profilePic;
        const ext = path.extname(image.name);
        const fileName = `${Date.now()}_${email}${ext}`;
        const filePath = path.join(uploadDir, fileName);

        await image.mv(filePath);

        const user = await User.findOneAndUpdate(
            { email },
            { name, email, profilePic: `/uploads/${fileName}` },
            { upsert: true, new: true }
        );

        res.json({ message: "✅ Profile uploaded", user });
    } catch (err) {
        console.error("❌ Upload Error:", err);
        res.status(500).json({ error: "Internal server error" });
    }
});

// ✅ Get Profile by Email
app.get("/profile/:email", async (req, res) => {
    try {
        const user = await User.findOne({ email: req.params.email });
        if (!user) {
            return res.status(404).json({ error: "❌ User not found" });
        }
        res.json(user);
    } catch (err) {
        console.error("❌ Fetch Error:", err);
        res.status(500).json({ error: "Internal server error" });
    }
});

// ✅ Save GPS Location
app.get("/update_location", async (req, res) => {
    console.log("🔍 Incoming Request Headers:", req.rawHeaders);
    console.log("🔍 Incoming Request Query Params:", req.query);

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
        res.json({ success: true, message: "✅ Location Saved", lat, lon });
    } catch (error) {
        console.error("❌ MongoDB Error:", error);
        res.status(500).json({ error: error.message });
    }
});

// ✅ Get Latest Location
app.get("/get_location", async (req, res) => {
    try {
        const lastLocation = await GpsLocation.findOne().sort({ timestamp: -1 }).lean();
        res.json(lastLocation || { lat: 0, lon: 0 });
    } catch (error) {
        console.error("❌ MongoDB Error:", error);
        res.status(500).json({ error: error.message });
    }
});

// ✅ Get All Locations
app.get("/get_all_locations", async (req, res) => {
    try {
        const allLocations = await GpsLocation.find().sort({ timestamp: -1 }).lean();
        res.json(allLocations);
    } catch (error) {
        console.error("❌ MongoDB Error:", error);
        res.status(500).json({ error: error.message });
    }
});

// ✅ Cleanup old GPS data
app.delete("/cleanup", async (req, res) => {
    try {
        const totalDocs = await GpsLocation.countDocuments();
        if (totalDocs > 100) {
            const toDelete = totalDocs - 100;
            const oldDocs = await GpsLocation.find().sort({ timestamp: 1 }).limit(toDelete);
            const idsToDelete = oldDocs.map(doc => doc._id);
            await GpsLocation.deleteMany({ _id: { $in: idsToDelete } });
            console.log(`🗑️ Deleted ${toDelete} old records`);
        }
        res.json({ message: "✅ Cleanup done if necessary" });
    } catch (error) {
        console.error("❌ MongoDB Cleanup Error:", error);
        res.status(500).json({ error: error.message });
    }
});

// ✅ Start Server
const PORT = process.env.PORT || 2000;
app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
});
