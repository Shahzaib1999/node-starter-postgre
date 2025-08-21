const express = require("express");
const rateLimit = require("express-rate-limit");

const controller = require("../controllers/auth.controller");
const validate = require("../middlewares/validate.middleware");
const authJwt = require("../middlewares/auth.middleware");
const { loginSchema, verify2faSchema } = require("../validators/auth");

const router = express.Router();

// 5 requests per 15 minutes per IP
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: {
    error: "Too many login attempts. Please try again in 15 minutes.",
  },
});

// 20 requests per 15 minutes per IP
const verifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 2000000,
  message: { error: "Too many verification attempts. Please try again later." },
});

/**
 * @route   POST /auth/login
 */
router.post(
  "/login",
  loginLimiter,
  validate(loginSchema),
  controller.loginOrSignup
);

/**
 * @route   GET /auth/verify
 * @query   token, email
 */
router.get("/verify", verifyLimiter, controller.verifyMagicLink);

/**
 * @route   POST /auth/2fa
 */
router.post(
  "/2fa",
  verifyLimiter,
  validate(verify2faSchema),
  controller.verify2fa
);

/**
 * @route   POST /auth/2fa/setup
 */
router.post("/2fa/setup", authJwt, controller.setup2fa);

/**
 * @route   POST /auth/2fa/verify
 */
router.post("/2fa/verify", authJwt, controller.verify2faSetup);

/**
 * @route   POST /auth/2fa/disable
 *
 * */
router.post("/2fa/disable", authJwt, controller.disable2fa);

module.exports = router;
