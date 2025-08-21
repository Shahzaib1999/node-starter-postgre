const Joi = require("joi");

exports.loginSchema = Joi.object({
  email: Joi.string().email().required(),
});

exports.verify2faSchema = Joi.object({
  email: Joi.string().email().required(),
  token: Joi.string().required(),
  twofa_code: Joi.string().required(),
});
