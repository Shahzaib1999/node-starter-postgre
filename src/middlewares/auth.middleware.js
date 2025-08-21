const jwt = require("jsonwebtoken");

const { User } = require("../models");
const { UNAUTHORIZED } = require("../constants/httpStatus");

module.exports = async (req, res, next) => {
  try {
    // Extract token from header (Authorization: Bearer <token>)
    const authHeader = req.headers["authorization"];
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res
        .status(UNAUTHORIZED)
        .json({ error: "Authentication required" });
    }
    const token = authHeader.replace("Bearer ", "").trim();

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res
        .status(UNAUTHORIZED)
        .json({ error: "Authentication required" });
    }

    const user = await User.findByPk(decoded.userId);
    if (!user) {
      return res
        .status(UNAUTHORIZED)
        .json({ error: "Authentication required" });
    }

    if (!user.is_active) {
      return res
        .status(UNAUTHORIZED)
        .json({ error: "Authentication required" });
    }

    req.userId = user.id;
    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
};
