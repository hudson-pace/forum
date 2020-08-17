const express = require('express');
const Joi = require('@hapi/joi');
const jwt = require('express-jwt');
const url = require('url');
const authorize = require('./middleware/authorize');
const validateRequest = require('./middleware/validate-request');
const { getById } = require('./user.service');
const postService = require('./post.service');
const Role = require('./helpers/role');
const { secret } = require('./config');

function createPostSchema(req, res, next) {
  const schema = Joi.object({
    text: Joi.string().required(),
    tags: Joi.array().items(Joi.string()),
  });
  validateRequest(req, next, schema);
}
function createPost(req, res, next) {
  getById(req.user.id)
    .then((user) => {
      postService.createPost(user, req.body.text, req.body.tags)
        .then((post) => {
          if (post) {
            return res.json('post successfully created');
          }
          return res.json('post could not be created');
        })
        .catch(next);
    })
    .catch(next);
}

function createCommentSchema(req, res, next) {
  const schema = Joi.object({
    text: Joi.string().required(),
  });
  validateRequest(req, next, schema);
}
function createComment(req, res, next) {
  getById(req.user.id)
    .then((user) => {
      postService.getRealPostId(req.params.id)
        .then((postId) => {
          postService.createComment(user, req.body.text, postId)
            .then((success) => res.json(success))
            .catch(next);
        })
        .catch(next);
    })
    .catch(next);
}
function createCommentReply(req, res, next) {
  getById(req.user.id)
    .then((user) => {
      postService.createComment(user, req.body.text, req.params.commentId, req.params.postId)
        .then((success) => res.json(success))
        .catch(next);
    })
    .catch(next);
}

function getChildrenOfComment(err, req, res, next) {
  postService.getChildrenOfComment(req.params.id, undefined)
    .then((comments) => res.json(comments))
    .catch(next);
}
function getChildrenOfCommentWithUser(req, res, next) {
  postService.getChildrenOfComment(req.params.id, req.user.id)
    .then((comments) => res.json(comments))
    .catch(next);
}

function getAllPosts(err, req, res, next) {
  const queryObject = url.parse(req.url, true).query;
  postService.getAllPosts(undefined, queryObject)
    .then((posts) => res.json(posts))
    .catch(next);
}
function getAllPostsWithUser(req, res, next) {
  const queryObject = url.parse(req.url, true).query;
  postService.getAllPosts(req.user.id, queryObject)
    .then((posts) => res.json(posts))
    .catch(next);
}

function getAllComments(err, req, res, next) {
  postService.getAllComments(req.params.id, undefined)
    .then((comments) => res.json(comments))
    .catch(next);
}
function getAllCommentsWithUser(req, res, next) {
  postService.getAllComments(req.params.id, req.user.id)
    .then((comments) => res.json(comments))
    .catch(next);
}

function getPostById(err, req, res, next) {
  postService.getPostById(req.params.id, undefined)
    .then((post) => res.json(post))
    .catch(next);
}
function getPostByIdWithUser(req, res, next) {
  postService.getPostById(req.params.id, req.user.id)
    .then((post) => res.json(post))
    .catch(next);
}

function deletePost(req, res, next) {
  postService.getPostById(req.params.id)
    .then((post) => {
      if (post.author === req.user.username || req.user.role === Role.Admin) {
        postService.deletePost(req.params.id)
          .then(({ success }) => res.json(success))
          .catch(next);
      }
      return res.status(401).json({ message: 'Unauthorized' });
    })
    .catch(next);
}

function upvotePost(req, res, next) {
  postService.upvotePost(req.user.id, req.params.id)
    .then((success) => res.json(success))
    .catch(next);
}
function undoPostUpvote(req, res, next) {
  postService.undoPostUpvote(req.user.id, req.params.id)
    .then((success) => res.json(success))
    .catch(next);
}
function upvoteComment(req, res, next) {
  postService.upvoteComment(req.user.id, req.params.id)
    .then((success) => res.json(success))
    .catch(next);
}
function undoCommentUpvote(req, res, next) {
  postService.undoCommentUpvote(req.user.id, req.params.id)
    .then((success) => res.json(success))
    .catch(next);
}

const router = express.Router();
router.post('/', authorize(), createPostSchema, createPost);
router.post('/:id', authorize(), createCommentSchema, createComment);
router.post('/:postId/comments/:commentId', authorize(), createCommentSchema, createCommentReply);
router.post('/:id/upvote', authorize(), upvotePost);
router.post('/:id/undo-upvote', authorize(), undoPostUpvote);
router.post('/comments/:id/upvote', authorize(), upvoteComment);
router.post('/comments/:id/undo-upvote', authorize(), undoCommentUpvote);
router.get('/', jwt({ secret, algorithms: ['HS256'] }), getAllPosts, getAllPostsWithUser);
router.get('/:id', jwt({ secret, algorithms: ['HS256'] }), getPostById, getPostByIdWithUser);
router.get('/comments/:id', jwt({ secret, algorithms: ['HS256'] }), getChildrenOfComment, getChildrenOfCommentWithUser);
router.get('/:id/comments', jwt({ secret, algorithms: ['HS256'] }), getAllComments, getAllCommentsWithUser);
router.delete('/:id', authorize(), deletePost);

module.exports = router;
