const { Sequelize, DataTypes } = require("sequelize");

const config = require("../config/database");
const sequelize = new Sequelize(config);

const User = require("./user")(sequelize, DataTypes);

// Associations

module.exports = {
  sequelize,
  User,
};
