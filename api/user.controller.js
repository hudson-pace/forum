const express = require('express');
const authorize = require('./middleware/authorize.js');
const Role = require('./helpers/role.js');
const userService = require('./user.service');
const tryToAuthenticate = require('./middleware/try-to-authenticate.js');

const router = express.Router();

module.exports = router;

function getAllUserDetails(user) {
  return {
    id: user.id,
    username: user.username,
    role: user.role,
    description: user.description,
    votes: user.votes,
  };
}

function getPublicUserDetails(user) {
  return {
    username: user.username,
    description: user.description,
  };
}

function getAllUsers(req, res, next) {
  userService.getAllUsers()
    .then((users) => res.status(200).json(users.map((x) => getAllUserDetails(x))))
    .catch(next);
}

function getUserFromToken(req, res) {
  return res.status(200).json(getAllUserDetails(req.user));
}

function getUserFromName(req, res, next) {
  userService.getUserFromName(req.params.username)
    .then((user) => res.status(200).json(getPublicUserDetails(user)))
    .catch(next);
}

function getPostsFromUser(req, res, next) {
  userService.getPostsFromUser(req.params.username, req.user)
    .then((posts) => res.status(200).json(posts))
    .catch(next);
}

function updateUser(req, res, next) {
  userService.updateUser(req.user, req.body)
    .then((user) => res.status(200).json(user))
    .catch(next);
}

function deleteUserFromToken(req, res, next) {
  userService.deleteUser(req.user)
    .then(({ success }) => res.json(success))
    .catch(next);
}

function deleteUserFromName(req, res, next) {
  userService.getUserByName(req.params.username)
    .then((user) => {
      userService.deleteUser(user)
        .then(({ success }) => res.json(success))
        .catch(next);
    })
    .catch(next);
}

router.get('/', authorize(Role.Admin), getAllUsers);
router.get('/user', authorize(), getUserFromToken);
router.get('/user/:username', getUserFromName);
router.get('/user/:username/posts', tryToAuthenticate(), getPostsFromUser);

router.put('/user', authorize(), updateUser);

router.delete('/user', authorize(), deleteUserFromToken);
router.delete('/user/:username', authorize(Role.Admin), deleteUserFromName);
