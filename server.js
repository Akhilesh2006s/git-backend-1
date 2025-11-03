require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const app = express();

// ====== Basic Middleware ======
app.use(cors());
app.use(express.json());

// 🧹 Disable caching — always serve fresh data
app.use((req, res, next) => {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, private");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  next();
});

// ====== MongoDB Connection ======
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log("✅ MongoDB Atlas Connected");
  console.log(`📍 Database: ${mongoose.connection.db.databaseName}`);
}).catch((err) => {
  console.error("❌ MongoDB Connection Error:", err.message);
  process.exit(1);
});

// ====== Schema & Model ======
const gpsSchema = new mongoose.Schema({
  device_id: { type: String, required: true },
  latitude: Number,
  longitude: Number,
  timestamp: { type: Date, default: Date.now },
}, { timestamps: true });

const GPSData = mongoose.model("GPSData", gpsSchema);

// ====== Request Logger ======
app.use((req, res, next) => {
  if (req.path.startsWith('/api')) {
    console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.path}`);
  }
  next();
});

// ====== API: Receive GPS Data ======
app.post("/api/gps/send", async (req, res) => {
  try {
    const { device_id, latitude, longitude, timestamp } = req.body;

    if (!device_id || !latitude || !longitude) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    const gpsEntry = new GPSData({
      device_id,
      latitude,
      longitude,
      timestamp: timestamp ? new Date(timestamp) : new Date(),
    });

    await gpsEntry.save();
    console.log(`📡 [${device_id}] ${latitude}, ${longitude}`);

    res.json({ success: true, message: "GPS data stored", data: gpsEntry });
  } catch (err) {
    console.error("❌ Error saving GPS data:", err.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ====== API: Get Latest Location for Each Tracker ======
app.get("/api/gps/latest_location/:device_id", async (req, res) => {
  try {
    const { device_id } = req.params;

    const latest = await GPSData.findOne({ device_id }).sort({ timestamp: -1 });

    if (!latest) {
      return res.status(404).json({ success: false, message: "No data found for this tracker" });
    }

    res.json({
      success: true,
      device_id,
      latitude: latest.latitude,
      longitude: latest.longitude,
      timestamp: latest.timestamp,
    });
  } catch (err) {
    console.error("❌ Error fetching GPS data:", err.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ====== Health Check ======
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    mongodb: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
    timestamp: new Date().toISOString(),
  });
});

// ====== Version Info ======
app.get("/api/version", (req, res) => {
  res.json({
    version: "v2.0.0",
    deployedAt: new Date().toISOString(),
  });
});

// ====== Static Files (optional frontend) ======
app.use(express.static("public"));

// ====== Start Server ======
const PORT = process.env.PORT || 4000;
app.listen(PORT, "0.0.0.0", () => {
  const url = process.env.RAILWAY_PUBLIC_DOMAIN
    ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`
    : `http://localhost:${PORT}`;
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 Access your app at: ${url}`);
});
