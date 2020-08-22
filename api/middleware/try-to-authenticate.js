const jwt = require('express-jwt');
const config = require('config');
const User = require('../user.model');
const userService = require('../user.service');

function tryToAuthenticate() {
  return [
    jwt({ secret: config.secret, algorithms: ['HS256'], credentialsRequired: false }),

    async (req, res, next) => {
      if (req.user) {
        let user = await User.findOne({ username: req.user.username });
        if (!user) {
          user = await userService.register({ username: req.user.username });
        }
        req.user = user;
      }
      return next();
    },

    // express-jwt throws an error for expired tokens, even with credentailsRequired: false.
    // This function allows it to continue without authenticating the user.
    (err, req, res, next) => {
      if (err.code === 'invalid_token') {
        return next();
      }
      return next(err);
    },
  ];
}

module.exports = tryToAuthenticate;
