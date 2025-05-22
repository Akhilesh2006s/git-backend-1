require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const app = express();

// ✅ CORS
const corsOptions = {
    origin: "*",
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"]
};
app.use(cors(corsOptions));
app.use(express.json());

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

// ✅ User Schema (Gmail Login)
const userSchema = new mongoose.Schema({
    name: String,
    email: String,
    photoUrl: String
});
const User = mongoose.model("User", userSchema);

// ✅ Routes

app.get("/", (req, res) => {
    res.json({ message: "🟢 GPS Tracker Backend Running!" });
});

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
        res.json({ success: true, message: "✅ Location Saved", lat, lon });
    } catch (error) {
        console.error("❌ Mongo Error:", error);
        res.status(500).json({ error: error.message });
    }
});

app.get("/get_location", async (req, res) => {
    try {
        const lastLocation = await GpsLocation.findOne().sort({ timestamp: -1 }).lean();
        res.json(lastLocation || { lat: 0, lon: 0 });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get("/get_all_locations", async (req, res) => {
    try {
        const all = await GpsLocation.find().sort({ timestamp: -1 }).lean();
        res.json(all);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ✅ Add Gmail Login Info
app.post("/add_user", async (req, res) => {
    const { name, email, photoUrl } = req.body;
    try {
        let user = await User.findOne({ email });
        if (!user) {
            user = new User({ name, email, photoUrl });
            await user.save();
        }
        res.json({ success: true, user });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ✅ Get All Users
app.get("/users", async (req, res) => {
    try {
        const users = await User.find().lean();
        res.json(users);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ✅ Cleanup Route - Fix: Delete oldest by _id
app.delete("/cleanup", async (req, res) => {
    try {
        const total = await GpsLocation.countDocuments();
        if (total > 100) {
            const toDelete = total - 100;
            const oldest = await GpsLocation.find().sort({ timestamp: 1 }).limit(toDelete).select("_id");
            const ids = oldest.map(doc => doc._id);
            await GpsLocation.deleteMany({ _id: { $in: ids } });
            console.log(`🗑️ Deleted ${toDelete} old records`);
        }
        res.json({ message: "✅ Cleanup done if needed" });
    } catch (error) {
        console.error("❌ Cleanup Error:", error);
        res.status(500).json({ error: error.message });
    }
});

// ✅ Start Server
const PORT = process.env.PORT || 2000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
