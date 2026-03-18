const Joi = require("joi");

const sessionSchema = Joi.object({
  lesson: Joi.string().trim().min(1).required()
});

const responseSchema = Joi.object({
  student_id: Joi.string().trim().min(1).required(),
  session_id: Joi.string().trim().min(1).required(),
  activity_id: Joi.string().trim().min(1).required(),
  question_id: Joi.number().integer().min(0).required(),
  answer: Joi.string().trim().allow(""),
  correct: Joi.boolean().required()
});

function validateSessionPayload(payload) {
  return sessionSchema.validate(payload, { abortEarly: false, allowUnknown: false });
}

function validateResponsePayload(payload) {
  return responseSchema.validate(payload, { abortEarly: false, allowUnknown: false });
}

function validateSessionCode(code) {
  return Joi.string().trim().length(6).pattern(/^[0-9]{6}$/).validate(code);
}

module.exports = {
  validateSessionPayload,
  validateResponsePayload,
  validateSessionCode
};
