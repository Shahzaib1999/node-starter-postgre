const { FORBIDDEN } = require("../constants/httpStatus");

module.exports = function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(FORBIDDEN).json({ error: "Forbidden" });
    }
    next();
  };
};
