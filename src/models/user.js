const ROLES = require("../constants/roles");

module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define("users", {
    email: { type: DataTypes.STRING, allowNull: false, unique: true },
    company_id: { type: DataTypes.INTEGER, allowNull: true },
    is_2fa_enabled: { type: DataTypes.BOOLEAN, defaultValue: false },
    two_fa_secret: DataTypes.STRING,
    magic_link_token: DataTypes.STRING,
    magic_link_expires: DataTypes.DATE,
    last_login: DataTypes.DATE,
    role: {
      type: DataTypes.ENUM(...Object.values(ROLES)),
      allowNull: false,
      defaultValue: "user",
    },
    is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
    createdAt: { type: DataTypes.DATE, field: "created_at" },
    updatedAt: { type: DataTypes.DATE, field: "updated_at" },
  });
  return User;
};
