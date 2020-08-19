const express = require('express');
const Joi = require('@hapi/joi');
const url = require('url');
const authorize = require('./middleware/authorize');
const validateRequest = require('./middleware/validate-request');
const postService = require('./post.service');

function getAllPosts(req, res, next) {
  const queryObject = url.parse(req.url, true).query;
  postService.getAllPosts(undefined, queryObject)
    .then((posts) => res.status(200).json(posts))
    .catch(next);
}
function getAllPostsWithUser(req, res, next) {
  const queryObject = url.parse(req.url, true).query;
  postService.getAllPosts(req.user, queryObject)
    .then((posts) => res.status(200).json(posts))
    .catch(next);
}

function getPostById(req, res, next) {
  postService.getPostById(undefined, req.params.id)
    .then((post) => res.status(200).json(post))
    .catch(next);
}
function getPostByIdWithUser(req, res, next) {
  postService.getPostById(req.user, req.params.id)
    .then((post) => res.status(200).json(post))
    .catch(next);
}

function getCommentsByPost(req, res, next) {
  postService.getCommentsByPost(undefined, req.params.id)
    .then((comments) => res.status(200).json(comments))
    .catch(next);
}
function getCommentsByPostWithUser(req, res, next) {
  postService.getCommentsByPost(req.user, req.params.id)
    .then((comments) => res.status(200).json(comments))
    .catch(next);
}

function createPostSchema(req, res, next) {
  const schema = Joi.object({
    text: Joi.string().required(),
    tags: Joi.array().items(Joi.string()),
  });
  validateRequest(req, next, schema);
}
function createPost(req, res, next) {
  postService.createPost(req.user, req.body.text, req.body.tags)
    .then((post) => res.status(201).json(post))
    .catch(next);
}

function createCommentSchema(req, res, next) {
  const schema = Joi.object({
    text: Joi.string().required(),
  });
  validateRequest(req, next, schema);
}
function createComment(req, res, next) {
  postService.createComment(req.user, req.body.text, req.params.id)
    .then((comment) => res.status(201).json(comment))
    .catch(next);
}

function upvotePost(req, res, next) {
  postService.upvotePost(req.user, req.params.id)
    .then((post) => res.status(200).json(post))
    .catch(next);
}
function undoPostUpvote(req, res, next) {
  postService.undoPostUpvote(req.user, req.params.id)
    .then((post) => res.status(200).json(post))
    .catch(next);
}

function createCommentReply(req, res, next) {
  postService.createCommentReply(req.user, req.body.text, req.params.id)
    .then((comment) => res.status(201).json(comment))
    .catch(next);
}

function upvoteComment(req, res, next) {
  postService.upvoteComment(req.user, req.params.id)
    .then((comment) => res.status(200).json(comment))
    .catch(next);
}
function undoCommentUpvote(req, res, next) {
  postService.undoCommentUpvote(req.user, req.params.id)
    .then((comment) => res.status(200).json(comment))
    .catch(next);
}

const router = express.Router();

router.get('/', getAllPosts);
router.get('/with-user', authorize(), getAllPostsWithUser);
router.get('/post/:id', getPostById);
router.get('/post/:id/with-user', authorize(), getPostByIdWithUser);
router.get('/post/:id/comments', getCommentsByPost);
router.get('/post/:id/comments/with-user', authorize(), getCommentsByPostWithUser);

router.post('/', authorize(), createPostSchema, createPost);
router.post('/post/:id', authorize(), createCommentSchema, createComment);
router.post('/post/:id/upvote', authorize(), upvotePost);
router.post('/post/:id/undo-upvote', authorize(), undoPostUpvote);
router.post('/comment/:id', authorize(), createCommentSchema, createCommentReply);
router.post('/comment/:id/upvote', authorize(), upvoteComment);
router.post('/comment/:id/undo-upvote', authorize(), undoCommentUpvote);

module.exports = router;
