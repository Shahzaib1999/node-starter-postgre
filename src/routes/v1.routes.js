const express = require("express");

const authRoutes = require("./auth.routes");

const router = express.Router();

router.get("/", (req, res) => {
  res.json({ message: "Welcome to the " + process.env.APP_NAME });
});
router.use("/auth", authRoutes);

module.exports = router;
