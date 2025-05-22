require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");


const app = express();

// ✅ CORS configuration
app.use(cors({
  origin: ['http://localhost:8081', 'exp://xra8ypw-sravanidasari-8081.exp.direct'],
  credentials: true
}));

app.use(express.json());

// ✅ Connect to MongoDB Atlas
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log("✅ Connected to MongoDB");
}).catch((err) => {
  console.error("❌ MongoDB Connection Error:", err);
  process.exit(1);
});

// ✅ Define User Schema
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['student', 'faculty'], default: 'student' },
  createdAt: { type: Date, default: Date.now }
});

// ✅ Define GPS Location Schema
const gpsSchema = new mongoose.Schema({
  busId: { type: String },
  lat: { type: Number, required: true },
  lon: { type: Number, required: true },
  timestamp: { type: Date, default: Date.now }
});

// ✅ Define Route Schema
const routeSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  routeName: { type: String, required: true },
  busId: { type: String },
  selectedAt: { type: Date, default: Date.now }
});

const User = mongoose.model("User", userSchema);
const GpsLocation = mongoose.model("GpsLocation", gpsSchema);
const BusRoute = mongoose.model("BusRoute", routeSchema);

// ✅ JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// ✅ Authentication Middleware
const authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: "No token provided" });

    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = await User.findById(decoded.userId);
    next();
  } catch (error) {
    res.status(401).json({ error: "Invalid token" });
  }
};

// ✅ Test API
app.get("/", (req, res) => {
  res.json({ message: "🟢 GPS Tracker Backend (MongoDB) is Running on Port 4000!" });
});

// ✅ Register User
app.post("/register", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email.endsWith('@vitapstudent.ac.in') && !email.endsWith('@vitap.ac.in')) {
      return res.status(400).json({ error: "Only VITAP emails allowed" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({
      email,
      password: hashedPassword,
      role: email.endsWith('@vitap.ac.in') ? 'faculty' : 'student'
    });

    await user.save();
    res.status(201).json({ message: "User created successfully" });
  } catch (error) {
    if (error.code === 11000) {
      res.status(400).json({ error: "Email already exists" });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

// ✅ Login User
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '1d' });
    res.json({ token, role: user.role });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ Save GPS Location (ESP32 device)
app.get("/update_location", async (req, res) => {
  let { lat, lon, busId } = req.query;
  lat = parseFloat(lat);
  lon = parseFloat(lon);

  if (isNaN(lat) || isNaN(lon)) {
    return res.status(400).json({ error: "❌ Invalid latitude or longitude" });
  }

  try {
    const newLocation = new GpsLocation({ lat, lon, busId });
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

// ✅ Save Route for User
app.post("/save_route", authenticate, async (req, res) => {
  try {
    const { routeName, busId } = req.body;
    const route = new BusRoute({
      userId: req.user._id,
      routeName,
      busId
    });

    await route.save();
    res.json({ success: true, message: "Route saved successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ Get User's Routes
app.get("/get_routes", authenticate, async (req, res) => {
  try {
    const routes = await BusRoute.find({ userId: req.user._id }).sort({ selectedAt: -1 });
    res.json(routes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ Start the Server
const PORT = 4000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on http://192.168.1.3:${PORT}`);
});
