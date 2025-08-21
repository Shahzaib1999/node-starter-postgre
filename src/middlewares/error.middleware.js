const { MAX_FILE_SIZE } = require("../constants/file");

module.exports = (err, req, res, next) => {
  console.error(err.stack);

  // Check for Multer file size error
  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(413).json({
      error: `File too large. Maximum allowed size is ${
        MAX_FILE_SIZE / (1024 * 1024)
      }MB.`,
    });
  }

  if (err?.response) {
    return res.status(err?.response?.status).json(err?.response?.data);
  }

  res.status(500).json({ error: err?.message || "Internal Server Error" });
};
