/* core authentication logic. generates jwt and refresh tokens, fetches user data */

const User = require('./user.model');
const Post = require('./post.model');
const Role = require('./helpers/role');
const { getPostDetails } = require('./post.service');

function getAllowedUpdateParams(params) {
  return {
    description: params.description,
  };
}

async function register(userParams) {
  const user = new User({ username: userParams.username, role: Role.User });
  await user.save();

  return user;
}

async function deleteUser(user) {
  let success = false;
  const result = await User.deleteOne({ _id: user.id });
  if (result.deletedCount > 0) {
    success = true;
  }
  return {
    success: {
      success,
    },
  };
}

async function getAllUsers() {
  const users = await User.find();
  return users;
}

async function getUserFromName(username) {
  const user = await User.findOne({ username });
  if (!user) {
    const err = new Error();
    err.name = 'NotFoundError';
    err.message = 'User not found';
    throw err;
  }
  return user;
}

async function updateUser(user, updateParams) {
  const allowedParams = getAllowedUpdateParams(updateParams);
  Object.assign(user, allowedParams);
  await user.save();
  return user;
}

async function getPostsFromUser(username, reqUser) {
  const user = await User.findOne({ username });
  if (!user) {
    const err = new Error();
    err.name = 'NotFoundError';
    err.message = 'User not found.';
    throw err;
  }
  const posts = await Post.find({ author: user.id });
  return posts.map((x) => getPostDetails(x, reqUser));
}

module.exports = {
  register,
  deleteUser,
  getAllUsers,
  getUserFromName,
  updateUser,
  getPostsFromUser,
};
