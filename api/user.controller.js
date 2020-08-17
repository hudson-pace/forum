const express = require('express');
const authorize = require('./middleware/authorize.js');
const Role = require('./helpers/role.js');
const userService = require('./user.service');
const postService = require('./post.service');

const router = express.Router();

module.exports = router;

function deleteUserFromName(req, res, next) {
  userService.getUserByName(req.params.username)
    .then((user) => {
      userService.deleteUser(user.id)
        .then(({ success }) => res.json(success))
        .catch(next);
    })
    .catch(next);
}
function deleteUserFromToken(req, res, next) {
  userService.deleteUser(req.user.id)
    .then(({ success }) => res.json(success))
    .catch(next);
}

function getAllUsers(req, res, next) {
  userService.getAllUsers()
    .then((users) => res.json(users))
    .catch(next);
}

function getPublicUserDetails(user) {
  return {
    username: user.username,
    description: user.description,
  };
}

function getUserFromName(req, res, next) {
  userService.getUserFromName(req.params.username)
    .then((user) => {
      if (user) {
        if (req.user && req.user.role === Role.Admin) {
          return res.json(user);
        }
        return res.json(getPublicUserDetails(user));
      }
      return res.sendStatus(404);
    })
    .catch(next);
}
function getUserFromToken(req, res) {
  return res.json(req.user);
}

function getPostsFromUser(req, res, next) {
  postService.getPostsFromUser(req.params.username)
    .then((posts) => res.json(posts))
    .catch(next);
}

function updateUser(req, res, next) {
  userService.updateUser(req.user.id, req.params.username, req.body)
    .then((success) => res.json(success))
    .catch(next);
}

router.delete('/user', authorize(), deleteUserFromToken);
router.delete('/user/:username', authorize(Role.Admin), deleteUserFromName);
router.get('/', authorize(Role.Admin), getAllUsers);
router.get('/user', authorize(), getUserFromToken);
router.get('/user/:username', getUserFromName);
router.get('/user/:username/admin', authorize(Role.Admin), getUserFromName);
router.get('/user/:username/posts', getPostsFromUser);
router.put('/user', authorize(), updateUser);
// router.put('/user/:username/admin', authorize(Role.Admin), updateUserFromName);
