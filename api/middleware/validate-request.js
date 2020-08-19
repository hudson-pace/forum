/* validates the body of a request against a Joi schema object */

function validateRequest(req, next, schema) {
  const options = {
    abortEarly: false,
    allowUnknown: true,
    stripUnknown: true,
  };
  const { error, value } = schema.validate(req.body, options);
  if (error) {
    const err = new Error();
    err.name = 'ValidationError';
    err.message = error.message;
    next(err);
  } else {
    req.body = value;
    next();
  }
}

module.exports = validateRequest;
