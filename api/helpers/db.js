const mongoose = require('mongoose');
const config = require('config');
const User = require('../user.model');
const Post = require('../post.model');
const Comment = require('../comment.model');

const connectionOptions = {
  useCreateIndex: true,
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false,
};
mongoose.connect(config.dbUri, connectionOptions);
mongoose.Promise = global.Promise;

function isValidId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

module.exports = {
  User,
  Post,
  Comment,
  isValidId,
};
