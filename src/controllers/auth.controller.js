const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const speakeasy = require("speakeasy");
const { Op } = require("sequelize");

const { User, Company } = require("../models");
const { sendWelcomeEmail, sendLoginEmail } = require("../utils/email");
const { generateResponse, generateError } = require("../utils/response");
const { BAD_REQUEST, UNAUTHORIZED, OK } = require("../constants/httpStatus");

const MAGIC_LINK_EXPIRY_MIN = 150;

// Unified signup/login endpoint
exports.loginOrSignup = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) return generateError(res, "Email is required.", BAD_REQUEST);

    let user = await User.findOne({ where: { email } });

    if (user && !user.is_active) {
      return generateError(
        res,
        "Your account is inactive. Please contact support",
        UNAUTHORIZED
      );
    }

    let isNewUser = false;
    if (!user) {
      user = await User.create({ email });
      isNewUser = true;
    }

    // Generate magic link token
    const token = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + MAGIC_LINK_EXPIRY_MIN * 60 * 1000);

    user.magic_link_token = token;
    user.magic_link_expires = expires;
    await user.save();

    const magicLink = `${
      process.env.APP_URL
    }/auth/verify?token=${token}&email=${encodeURIComponent(email)}`;

    if (isNewUser) {
      await sendWelcomeEmail(email, magicLink);
    } else {
      await sendLoginEmail(email, magicLink);
    }

    return generateResponse(res, null, "Email sent successfully!", OK);
  } catch (err) {
    next(err);
  }
};

// Verify magic link endpoint
exports.verifyMagicLink = async (req, res, next) => {
  try {
    const { token, email } = req.query;
    if (!token || !email)
      return generateError(res, "Invalid link.", BAD_REQUEST);

    const user = await User.findOne({
      where: { email, magic_link_token: token },
      include: [
        {
          model: Company,
          as: "company",
          required: false,
          attributes: { exclude: ["webhook_token"] },
        },
      ],
    });
    if (!user || user.magic_link_expires < new Date()) {
      return generateError(res, "Invalid or expired link.", UNAUTHORIZED);
    }

    // Invalidate token
    user.magic_link_token = null;
    user.magic_link_expires = null;

    // If 2FA enabled, return flag so frontend knows to prompt for code
    if (user.is_2fa_enabled) {
      //   await user.save();
      return generateResponse(res, { twofa: true }, "2FA required.", OK);
    }

    // Otherwise, issue JWT
    user.last_login = new Date();
    await user.save();
    const tokenJWT = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    return generateResponse(
      res,
      {
        token: tokenJWT,
        company: user?.company || null,
        role: user.role,
      },
      "Login successful.",
      OK
    );
  } catch (err) {
    next(err);
  }
};

// Verify 2FA endpoint
exports.verify2fa = async (req, res, next) => {
  try {
    const { email, token, twofa_code } = req.body;
    if (!email || !token || !twofa_code) {
      return generateError(res, "Missing parameters.", BAD_REQUEST);
    }
    const user = await User.findOne({
      where: {
        email,
        magic_link_token: token,
        magic_link_expires: { [Op.gt]: new Date() },
      },
      include: [
        {
          model: Company,
          as: "company",
          required: false,
        },
      ],
    });

    if (!user) {
      return generateError(res, "Invalid or expired link.", UNAUTHORIZED);
    }

    if (!user || !user.is_2fa_enabled || !user.two_fa_secret) {
      return generateError(res, "Invalid 2FA code.", UNAUTHORIZED);
    }
    const verified = speakeasy.totp.verify({
      secret: user.two_fa_secret,
      encoding: "base32",
      token: twofa_code,
    });

    if (!verified) return generateError(res, "Invalid 2FA code.", UNAUTHORIZED);

    // Complete login
    user.magic_link_token = null;
    user.magic_link_expires = null;
    user.last_login = new Date();
    await user.save();
    const tokenJWT = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });
    return generateResponse(
      res,
      {
        token: tokenJWT,
        company: user?.company || null,
        role: user.role,
      },
      "Login successful.",
      OK
    );
  } catch (err) {
    next(err);
  }
};

// Setup/enable 2FA endpoint (must be authenticated via JWT)
exports.setup2fa = async (req, res, next) => {
  try {
    // Assumes JWT middleware sets req.userId
    const user = await User.findByPk(req.userId);
    if (!user) return generateError(res, "User not found.", UNAUTHORIZED);

    const secret = speakeasy.generateSecret({ name: process.env.APP_NAME });
    user.two_fa_secret = secret.base32;
    // user.is_2fa_enabled = true;
    await user.save();

    return generateResponse(
      res,
      {
        otpauth_url: secret.otpauth_url,
        base32: secret.base32,
      },
      "2FA setup initiated.",
      OK
    );
  } catch (err) {
    next(err);
  }
};

// verify 2FA setup (after user scans QR code)
exports.verify2faSetup = async (req, res, next) => {
  try {
    const { twofa_code } = req.body;
    const user = req.user;

    if (!user.two_fa_secret) {
      return generateError(res, "2FA is not enabled.", BAD_REQUEST);
    }

    const verified = speakeasy.totp.verify({
      secret: user.two_fa_secret,
      encoding: "base32",
      token: twofa_code,
    });

    if (!verified) {
      return generateError(res, "Invalid 2FA code.", UNAUTHORIZED);
    }

    // Now activate 2FA
    user.is_2fa_enabled = true;
    // user.two_fa_secret = null;
    await user.save();

    return generateResponse(res, null, "2FA setup completed.", OK);
  } catch (err) {
    next(err);
  }
};

// Disable 2FA for logged-in user
exports.disable2fa = async (req, res, next) => {
  try {
    const { twofa_code } = req.body;
    const user = req.user;

    if (!user.is_2fa_enabled || !user.two_fa_secret) {
      return generateError(res, "2FA is not enabled.", BAD_REQUEST);
    }

    // Verify provided code
    const verified = speakeasy.totp.verify({
      secret: user.two_fa_secret,
      encoding: "base32",
      token: twofa_code,
    });
    if (!verified) {
      return generateError(res, "Invalid 2FA code.", UNAUTHORIZED);
    }

    // Disable 2FA
    user.is_2fa_enabled = false;
    user.two_fa_secret = null;
    await user.save();

    return generateResponse(res, null, "2FA has been disabled.", OK);
  } catch (err) {
    next(err);
  }
};
