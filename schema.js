// validation/ownerValidation.js
const Joi = require("joi");

const ownerSchema = Joi.object({
  restaurantName: Joi.string().min(2).max(100).required(),
  ownerName: Joi.string().min(3).max(50).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
});

module.exports = { ownerSchema };
