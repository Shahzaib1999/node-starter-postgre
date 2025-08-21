const multer = require("multer");
const path = require("path");

const {
  MAX_FILE_SIZE,
  ALLOWED_EXTENSIONS,
  ALLOWED_MIME_TYPES,
} = require("../constants/file");

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (
    ALLOWED_EXTENSIONS.includes(ext) &&
    ALLOWED_MIME_TYPES.includes(file.mimetype)
  ) {
    cb(null, true);
  } else {
    cb(
      new Error(
        `Only the following image types are allowed: ${ALLOWED_EXTENSIONS.join(
          ", "
        )}`
      ),
      false
    );
  }
};

module.exports = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter,
});
