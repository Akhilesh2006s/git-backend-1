require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const app = express();

// Basic middleware

app.use(cors());
app.use(express.json());

// 🧹 Disable caching — always serve fresh data
app.use((req, res, next) => {
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, private");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    next();
});

// 🧠 MongoDB Connection
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => {
    console.log("✅ MongoDB Atlas Connected");
    console.log(`📍 Database: ${mongoose.connection.db.databaseName}`);
}).catch((err) => {
    console.error("❌ MongoDB Connection Error:", err.message);
    console.error("💡 Make sure your MONGO_URI is correct and Atlas network access allows Railway IPs");
    process.exit(1);
});

// 🧾 Request logger for debugging API hits
app.use((req, res, next) => {
    if (req.path.startsWith('/api')) {
        console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.path}`);
    }
    next();
});

// ✅ API Routes
app.use("/api", require("./routes/index"));

// 🩺 Health check
app.get("/api/health", (req, res) => {
    res.json({ 
        status: "ok", 
        timestamp: new Date().toISOString(),
        mongodb: mongoose.connection.readyState === 1 ? "connected" : "disconnected"
    });
});

// 🔄 Version endpoint — helps confirm redeploys
app.get("/api/version", (req, res) => {
    res.json({
        version: "v1.0.1", // manually update when redeploying
        deployedAt: new Date().toISOString()
    });
});

// 🗂️ Static files (for frontend)
app.use(express.static('public'));

// 🚀 Start server
const PORT = process.env.PORT || 4000;
app.listen(PORT, "0.0.0.0", () => {
    const url = process.env.RAILWAY_PUBLIC_DOMAIN 
        ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`
        : `http://localhost:${PORT}`;
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📍 Access your app at: ${url}`);
});
