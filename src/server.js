require("dotenv").config();
const app = require("./app");
const { ensureDatabase } = require("./utils/ensureDatabase");
const config = require("../config/database");

const PORT = process.env.PORT || 3002;

(async () => {
  await ensureDatabase(config);
})();

app.listen(PORT, () => console.log(`API listening on port ${PORT}`));
