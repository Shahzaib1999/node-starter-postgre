const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const rateLimit = require("express-rate-limit");

const v1Routes = require("./routes/v1.routes");
const errorHandler = require("./middlewares/error.middleware");

const app = express();

app.use(
  helmet({
    referrerPolicy: { policy: "no-referrer" },
  })
);
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  })
);

app.use(express.json({ limit: "2mb" }));

// 60 requests per 5 minutes per IP
const limiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 60, // Limit each IP to 60 requests per windowMs
  standardHeaders: true, // Return rate limit info in headers
  legacyHeaders: false, // Disable deprecated headers
  message: {
    error: "Too many requests. Please try again later.",
  },
});
app.use("/v1/api", limiter);

// API Routes
app.use("/v1/api", v1Routes);

app.use(errorHandler);

module.exports = app;
