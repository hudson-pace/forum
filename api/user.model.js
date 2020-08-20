/* defines schema for users collection in database */

const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  username: {
    type: String,
    unique: true,
    required: true,
  },
  role: {
    type: String,
    required: true,
  },
  votes: [{ type: mongoose.Types.ObjectId }],
  description: { type: String },
});

module.exports = mongoose.model('User', schema);
