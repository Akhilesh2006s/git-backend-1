require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => {
    console.log("✅ MongoDB Connected");
}).catch((err) => {
    console.error("❌ MongoDB Error:", err);
    process.exit(1);
});

// Routes
app.use("/api", require("./routes/index"));

const PORT = process.env.PORT || 4000;
app.listen(PORT, "0.0.0.0", () => {
console.log(`🚀 Server running at http://localhost:${PORT}`);
});
