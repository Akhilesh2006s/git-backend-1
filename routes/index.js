const express = require("express");
const router = express.Router();

// ✅ These should be routers, not controllers
router.use("/gps", require("./gps"));
router.use("/stops", require("./stops"));
router.use('/attendance', require('./attendance'));
router.use('/students', require('./student'));

module.exports = router;