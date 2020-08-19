const { Post, Comment } = require('./helpers/db');

/* Helper functions. */
function getPostDetails(post, user) {
  const details = {
    text: post.text,
    datePosted: post.datePosted,
    votes: post.votes,
    tags: post.tags,
    postId: post.postId,
    id: post.id,
  };
  if (post.author) {
    details.author = post.author.username;
  }
  if (user) {
    details.hasBeenUpvoted = user.votes.includes(post.id);
  }
  return details;
}

function getCommentDetails(comment, user) {
  const details = {
    text: comment.text,
    datePosted: comment.datePosted,
    votes: comment.votes,
    id: comment.id,
    parent: comment.parent,
    post: comment.post,
  };
  if (comment.author) {
    details.author = comment.author.username;
  }
  if (user) {
    details.hasBeenUpvoted = user.votes.includes(comment.id);
  }
  return details;
}

/* Functions for GET requests. */
async function getAllPosts(user, params) {
  let { quantity } = params;
  if (!quantity) {
    quantity = 10;
  } else if (quantity > 50) {
    quantity = 50;
  }
  let postQuery;
  if (params.tags && params.tags.length > 0) {
    postQuery = Post.find({ tags: { $all: params.tags } });
  } else {
    postQuery = Post.find({ });
  }
  postQuery = postQuery.sort({ datePosted: -1 }).limit(quantity).populate('author');
  const posts = await postQuery;
  return posts.map((post) => getPostDetails(post, user));
}

async function getPostById(user, postId) {
  const post = await Post.findOne({ _id: postId }).populate('author');
  if (!post) {
    const err = new Error();
    err.name = 'NotFoundError';
    err.message = 'Post not found.';
    throw err;
  }
  const comments = await Comment.find({ post: postId }).sort({ datePosted: -1 }).populate('author');
  const postDetails = getPostDetails(post, user);
  postDetails.comments = comments.map((comment) => getCommentDetails(comment, user));
  return postDetails;
}

async function getCommentsByPost(user, postId) {
  const comments = await Comment.find({ post: postId }).populate('author');
  return comments.map((comment) => getCommentDetails(comment, user));
}

/* functions for post requests */
async function createPost(author, text, tags) {
  const post = new Post();
  post.author = author.id;
  post.text = text;
  post.tags = tags;
  await post.save();
  post.author = author;
  return getPostDetails(post, author);
}

async function createComment(author, text, postId) {
  const post = await Post.findOne({ _id: postId });
  if (!post) {
    const err = new Error();
    err.name = 'NotFoundError';
    err.message = 'Post not found.';
    throw err;
  }
  const comment = new Comment();
  comment.author = author.id;
  comment.text = text;
  comment.parent = postId;
  comment.post = postId;
  if (postId) {
    comment.post = postId;
  }
  await comment.save();
  comment.author = author;
  return getCommentDetails(comment);
}

async function upvotePost(user, postId) {
  const post = await Post.findOne({ _id: postId });
  if (!post) {
    const err = new Error();
    err.name = 'NotFoundError';
    err.message = 'Post not found.';
    throw err;
  }
  if (!user.votes.includes(post.id)) {
    user.votes.push(post.id);
    await user.save();
    post.votes += 1;
    await post.save();
  }
  return getPostDetails(post, user);
}

async function undoPostUpvote(user, postId) {
  const post = await Post.findOne({ _id: postId });
  if (!post) {
    const err = new Error();
    err.name = 'NotFoundError';
    err.message = 'Post not found.';
    throw err;
  }
  const index = user.votes.indexOf(postId);
  if (index !== -1) {
    user.votes.splice(index, 1);
    await user.save();
    post.votes -= 1;
    await post.save();
  }
  return getPostDetails(post, user);
}

async function createCommentReply(author, text, commentId) {
  const comment = await Comment.findOne({ _id: commentId });
  if (!comment) {
    const err = new Error();
    err.name = 'NotFoundError';
    err.message = 'Comment not found.';
    throw err;
  }
  const newComment = new Comment();
  newComment.author = author.id;
  newComment.text = text;
  newComment.parent = commentId;
  newComment.post = comment.post;
  await newComment.save();
  newComment.author = author;
  return getCommentDetails(newComment);
}

async function upvoteComment(user, commentId) {
  const comment = await Comment.findOne({ _id: commentId });
  if (!comment) {
    const err = new Error();
    err.name = 'NotFoundError';
    err.message = 'Comment not found.';
    throw err;
  }
  if (!user.votes.includes(commentId)) {
    user.votes.push(commentId);
    await user.save();
    comment.votes += 1;
    await comment.save();
  }
  return getCommentDetails(comment, user);
}

async function undoCommentUpvote(user, commentId) {
  const comment = await Comment.findOne({ _id: commentId });
  if (!comment) {
    const err = new Error();
    err.name = 'NotFoundError';
    err.message = 'Comment not found.';
    throw err;
  }
  const index = user.votes.indexOf(commentId);
  if (index !== -1) {
    user.votes.splice(index, 1);
    await user.save();
    comment.votes -= 1;
    await comment.save();
  }
  return getCommentDetails(comment, user);
}

module.exports = {
  createPost,
  getAllPosts,
  getPostById,
  createComment,
  createCommentReply,
  upvotePost,
  undoPostUpvote,
  upvoteComment,
  undoCommentUpvote,
  getCommentsByPost,
};
