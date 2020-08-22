/* eslint-disable no-undef, no-shadow, import/no-extraneous-dependencies, object-curly-newline */
process.env.NODE_ENV = 'test';

const chai = require('chai');
const chaiHttp = require('chai-http');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const config = require('config');

const Post = require('../post.model');
const User = require('../user.model');
const Comment = require('../comment.model');
const Role = require('../helpers/role');
const server = require('../server');

const should = chai.should(); // eslint-disable-line no-unused-vars

chai.use(chaiHttp);

describe('Posts', () => {
  before((done) => {
    Post.deleteMany({}, (err) => {
      done();
    });
  });
  before((done) => {
    User.deleteMany({}, (err) => {
      done();
    });
  });

  describe('get /posts', () => {
    it('It should return an array of posts.', (done) => {
      chai.request(server)
        .get('/posts')
        .end((err, res) => {
          res.should.have.status(200);
          res.body.should.be.a('array');
          done();
        });
    });
    describe('When no posts exist:', () => {
      it('It should return an array of length 0.', (done) => {
        chai.request(server)
          .get('/posts')
          .end((err, res) => {
            res.body.length.should.be.eql(0);
            done();
          });
      });
    });
    describe('When some posts exist:', () => {
      before((done) => {
        const posts = [
          { text: 'testText1', author: mongoose.Types.ObjectId() },
          { text: 'testText2', author: mongoose.Types.ObjectId() },
          { text: 'testText3', author: mongoose.Types.ObjectId() },
        ];
        Post.insertMany(posts, (err, posts) => {
          done();
        });
      });
      after((done) => {
        Post.deleteMany({ }, (err) => {
          done();
        });
      });

      it('It should return all posts.', (done) => {
        chai.request(server)
          .get('/posts')
          .end((err, res) => {
            res.body.length.should.be.eql(3);
            done();
          });
      });
      it('It should not include user-specific information in response if user is not authenticated.', (done) => {
        chai.request(server)
          .get('/posts')
          .end((err, res) => {
            res.body[0].should.not.have.property('hasBeenUpvoted');
            done();
          });
      });
      it('It should include user-specific information in response if user is authenticated.', (done) => {
        const accessToken = jwt.sign({ username: 'test' }, config.secret, { expiresIn: '15m' });
        chai.request(server)
          .get('/posts')
          .set('Authorization', `Bearer ${accessToken}`)
          .end((err, res) => {
            res.body[0].should.have.property('hasBeenUpvoted');
            done();
          });
      });
    });
  });

  describe('get /posts/post/:id', () => {
    let postId;
    before((done) => {
      const post = new Post({ text: 'testText', author: mongoose.Types.ObjectId() });
      post.save((err, post) => {
        postId = post.postId;
        done();
      });
    });
    after((done) => {
      Post.deleteMany({ }, (err) => {
        done();
      });
    });

    it('It should return 404 if there is no post with the given id.', (done) => {
      chai.request(server)
        .get(`/posts/post/${mongoose.Types.ObjectId()}`)
        .end((err, res) => {
          res.should.have.status(404);
          done();
        });
    });
    it('It should return the post with the given id.', (done) => {
      chai.request(server)
        .get(`/posts/post/${postId}`)
        .end((err, res) => {
          res.should.have.status(200);
          res.body.should.be.a('object');
          res.body.should.have.property('postId').eql(postId);
          done();
        });
    });
    it('It should not include user-specific information if user is not authenticated.', (done) => {
      chai.request(server)
        .get(`/posts/post/${postId}`)
        .end((err, res) => {
          res.body.should.not.have.property('hasBeenUpvoted');
          done();
        });
    });
    it('It should include user-specific information if user is authenticated.', (done) => {
      const accessToken = jwt.sign({ username: 'test' }, config.secret, { expiresIn: '15m' });
      chai.request(server)
        .get(`/posts/post/${postId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .end((err, res) => {
          res.body.should.have.property('hasBeenUpvoted');
          done();
        });
    });
  });

  describe('get /posts/post/:id/comments', () => {
    const accessToken = jwt.sign({ username: 'test' }, config.secret, { expiresIn: '15m' });
    let postId;
    before((done) => {
      const post = new Post({ text: 'testText', author: mongoose.Types.ObjectId() });
      post.save((err, post) => {
        postId = post.id;
        done();
      });
    });
    after((done) => {
      Post.deleteMany({ }, (err) => {
        done();
      });
    });

    it('It should return an array of comments.', (done) => {
      chai.request(server)
        .get(`/posts/post/${postId}/comments`)
        .end((err, res) => {
          res.should.have.status(200);
          res.body.should.be.a('array');
          done();
        });
    });
    describe('When no comments exist:', () => {
      it('It should return an array of length 0.', (done) => {
        chai.request(server)
          .get(`/posts/post/${postId}/comments`)
          .end((err, res) => {
            res.body.length.should.be.eql(0);
            done();
          });
      });
    });
    describe('When some comments exist:', () => {
      before((done) => {
        const comments = [
          // These should be returned:
          { text: 'testText', author: mongoose.Types.ObjectId(), parent: mongoose.Types.ObjectId(), post: postId },
          { text: 'testText', author: mongoose.Types.ObjectId(), parent: mongoose.Types.ObjectId(), post: postId },
          { text: 'testText', author: mongoose.Types.ObjectId(), parent: mongoose.Types.ObjectId(), post: postId },

          // These should not be:
          { text: 'testText', author: mongoose.Types.ObjectId(), parent: mongoose.Types.ObjectId(), post: mongoose.Types.ObjectId() },
          { text: 'testText', author: mongoose.Types.ObjectId(), parent: mongoose.Types.ObjectId(), post: mongoose.Types.ObjectId() },
        ];
        Comment.insertMany(comments, (err, comments) => {
          done();
        });
      });
      after((done) => {
        Comment.deleteMany({ }, (err) => {
          done();
        });
      });

      it('It should return all comments whose "post" field matches the given id.', (done) => {
        chai.request(server)
          .get(`/posts/post/${postId}/comments`)
          .end((err, res) => {
            res.body.length.should.be.eql(3);
            done();
          });
      });
      it('It should not include user-specific information in response when user is not authenticated.', (done) => {
        chai.request(server)
          .get(`/posts/post/${postId}/comments`)
          .end((err, res) => {
            res.body[0].should.not.have.property('hasBeenUpvoted');
            done();
          });
      });
      it('It should include user-specific information in response when user is authenticated.', (done) => {
        chai.request(server)
          .get(`/posts/post/${postId}/comments`)
          .set('Authorization', `Bearer ${accessToken}`)
          .end((err, res) => {
            res.body[0].should.have.property('hasBeenUpvoted');
            done();
          });
      });
    });
  });

  describe('post /posts', () => {
    it('It should not allow unauthenticated users.', (done) => {
      const post = { text: 'testPost' };
      chai.request(server)
        .post('/posts')
        .send(post)
        .end((err, res) => {
          res.should.have.status(401);
          done();
        });
    });
    it('It should not create post without text field.', (done) => {
      const accessToken = jwt.sign({ username: 'test' }, config.secret, { expiresIn: '15m' });
      const post = { };
      chai.request(server)
        .post('/posts')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(post)
        .end((err, res) => {
          res.should.have.status(400);
          res.body.should.have.property('message').eql('"text" is required');
          done();
        });
    });
    it('It should create a post without tags field.', (done) => {
      const accessToken = jwt.sign({ username: 'test' }, config.secret, { expiresIn: '15m' });
      const post = { text: 'testText' };
      chai.request(server)
        .post('/posts')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(post)
        .end((err, res) => {
          res.should.have.status(201);
          res.body.should.be.a('object');
          done();
        });
    });
    it('It should create a post with specified tags.', (done) => {
      const accessToken = jwt.sign({ username: 'test' }, config.secret, { expiresIn: '15m' });
      const post = { text: 'testText', tags: ['tag1', 'tag2'] };
      chai.request(server)
        .post('/posts')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(post)
        .end((err, res) => {
          res.should.have.status(201);
          res.body.should.be.a('object');
          res.body.should.have.property('tags').eql(['tag1', 'tag2']);
          done();
        });
    });
    it('It should create a post whose author is the requesting user.', (done) => {
      const accessToken = jwt.sign({ username: 'test' }, config.secret, { expiresIn: '15m' });
      const post = { text: 'testText' };
      chai.request(server)
        .post('/posts')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(post)
        .end((err, res) => {
          res.should.have.status(201);
          res.body.should.be.a('object');
          res.body.should.have.property('author').eql('test');
          done();
        });
    });
  });

  describe('post /posts/post/:id', () => {
    let postId;
    before((done) => {
      const post = new Post({ text: 'testText', author: mongoose.Types.ObjectId() });
      post.save((err, post) => {
        postId = post.id;
        done();
      });
    });
    after((done) => {
      Post.deleteMany({ }, (err) => {
        done();
      });
    });

    it('It should not allow unauthenticated users.', (done) => {
      const comment = { text: 'testPost' };
      chai.request(server)
        .post(`/posts/post/${postId}`)
        .send(comment)
        .end((err, res) => {
          res.should.have.status(401);
          done();
        });
    });

    it('It should not allow comments on nonexistent posts.', (done) => {
      const accessToken = jwt.sign({ username: 'test' }, config.secret, { expiresIn: '15m' });
      const comment = { text: 'testText' };
      chai.request(server)
        .post(`/posts/post/${mongoose.Types.ObjectId()}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(comment)
        .end((err, res) => {
          res.should.have.status(404);
          done();
        });
    });

    it('It should not create a comment without text field', (done) => {
      const accessToken = jwt.sign({ username: 'test' }, config.secret, { expiresIn: '15m' });
      const comment = { };
      chai.request(server)
        .post(`/posts/post/${postId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(comment)
        .end((err, res) => {
          res.should.have.status(400);
          res.body.should.have.property('message').eql('"text" is required');
          done();
        });
    });
    it('It should create a comment whose parent and post fields are equal to the given post id.', (done) => {
      const accessToken = jwt.sign({ username: 'test' }, config.secret, { expiresIn: '15m' });
      const comment = { text: 'testText' };
      chai.request(server)
        .post(`/posts/post/${postId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(comment)
        .end((err, res) => {
          res.should.have.status(201);
          res.body.should.be.a('object');
          res.body.should.have.property('parent').eql(postId);
          res.body.should.have.property('post').eql(postId);
          done();
        });
    });
  });

  describe('post /posts/post/:id/upvote', () => {
    const accessToken = jwt.sign({ username: 'upvoteTest' }, config.secret, { expiresIn: '15m' });
    let post;
    let user;
    beforeEach((done) => {
      post = new Post({ text: 'testText', author: mongoose.Types.ObjectId() });
      post.save((err, post) => {
        done();
      });
    });
    beforeEach((done) => {
      user = new User({ username: 'upvoteTest', role: Role.User });
      user.save((err, user) => {
        done();
      });
    });
    afterEach((done) => {
      User.deleteMany({ }, (err) => {
        done();
      });
    });
    afterEach((done) => {
      Post.deleteMany({ }, (err) => {
        done();
      });
    });

    it('It should not allow unauthenticated users.', (done) => {
      chai.request(server)
        .post(`/posts/post/${post.id}/upvote`)
        .end((err, res) => {
          res.should.have.status(401);
          done();
        });
    });

    it('It should not upvote nonexistent posts.', (done) => {
      chai.request(server)
        .post(`/posts/post/${mongoose.Types.ObjectId()}/upvote`)
        .set('Authorization', `Bearer ${accessToken}`)
        .end((err, res) => {
          res.should.have.status(404);
          done();
        });
    });

    describe('When the post has not been upvoted:', () => {
      it('It should increment the vote count of the post with the given id.', (done) => {
        post.votes.should.eql(0);
        chai.request(server)
          .post(`/posts/post/${post.id}/upvote`)
          .set('Authorization', `Bearer ${accessToken}`)
          .end((err, res) => {
            res.should.have.status(200);
            res.body.should.be.a('object');
            res.body.should.have.property('votes').eql(1);
            done();
          });
      });

      it("It should append the post's id to the list of the user's votes.", (done) => {
        post.should.not.have.property('hasBeenUpvoted');
        chai.request(server)
          .post(`/posts/post/${post.id}/upvote`)
          .set('Authorization', `Bearer ${accessToken}`)
          .end((err, res) => {
            res.should.have.status(200);
            res.body.should.be.a('object');
            res.body.should.have.property('hasBeenUpvoted').eql(true);
            done();
          });
      });
    });

    describe('When the post has already been upvoted:', () => {
      beforeEach((done) => {
        chai.request(server)
          .post(`/posts/post/${post.id}/upvote`)
          .set('Authorization', `Bearer ${accessToken}`)
          .end((err, res) => {
            post = res.body;
            done();
          });
      });

      it('It should have no effect.', (done) => {
        post.should.have.property('hasBeenUpvoted').eql(true);
        post.should.have.property('votes').eql(1);
        chai.request(server)
          .post(`/posts/post/${post.id}/upvote`)
          .set('Authorization', `Bearer ${accessToken}`)
          .end((err, res) => {
            res.body.should.have.property('hasBeenUpvoted').eql(true);
            res.body.should.have.property('votes').eql(1);
            done();
          });
      });
    });
  });

  describe('post /posts/post/:id/undo-upvote', () => {
    const accessToken = jwt.sign({ username: 'upvoteTest' }, config.secret, { expiresIn: '15m' });
    let post;
    let user;
    beforeEach((done) => {
      post = new Post({ text: 'testText', author: mongoose.Types.ObjectId() });
      post.save((err, post) => {
        done();
      });
    });
    beforeEach((done) => {
      user = new User({ username: 'upvoteTest', role: Role.User });
      user.save((err, user) => {
        done();
      });
    });
    afterEach((done) => {
      User.deleteMany({ }, (err) => {
        done();
      });
    });
    afterEach((done) => {
      Post.deleteMany({ }, (err) => {
        done();
      });
    });

    it('It should not allow unauthenticated users.', (done) => {
      chai.request(server)
        .post(`/posts/post/${post.id}/undo-upvote`)
        .end((err, res) => {
          res.should.have.status(401);
          done();
        });
    });

    it('It should not affect nonexistent posts.', (done) => {
      chai.request(server)
        .post(`/posts/post/${mongoose.Types.ObjectId()}/undo-upvote`)
        .set('Authorization', `Bearer ${accessToken}`)
        .end((err, res) => {
          res.should.have.status(404);
          done();
        });
    });

    describe('When the post has not been upvoted:', () => {
      it('It should have no effect.', (done) => {
        post.votes.should.eql(0);
        post.should.not.have.property('hasBeenUpvoted');
        chai.request(server)
          .post(`/posts/post/${post.id}/undo-upvote`)
          .set('Authorization', `Bearer ${accessToken}`)
          .end((err, res) => {
            res.should.have.status(200);
            res.body.should.be.a('object');
            res.body.should.have.property('votes').eql(0);
            res.body.should.have.property('hasBeenUpvoted').eql(false);
            done();
          });
      });
    });

    describe('When the post has been upvoted:', () => {
      beforeEach((done) => {
        chai.request(server)
          .post(`/posts/post/${post.id}/upvote`)
          .set('Authorization', `Bearer ${accessToken}`)
          .end((err, res) => {
            post = res.body;
            done();
          });
      });

      it('It should decrement the number of votes on the given post.', (done) => {
        post.should.have.property('votes').eql(1);
        chai.request(server)
          .post(`/posts/post/${post.id}/undo-upvote`)
          .set('Authorization', `Bearer ${accessToken}`)
          .end((err, res) => {
            res.body.should.have.property('votes').eql(0);
            done();
          });
      });
      it("It should remove the post from the user's list of votes.", (done) => {
        post.should.have.property('hasBeenUpvoted').eql(true);
        chai.request(server)
          .post(`/posts/post/${post.id}/undo-upvote`)
          .set('Authorization', `Bearer ${accessToken}`)
          .end((err, res) => {
            res.body.should.have.property('hasBeenUpvoted').eql(false);
            done();
          });
      });
    });
  });

  describe('post /posts/comment/:id', () => {
    const accessToken = jwt.sign({ username: 'test' }, config.secret, { expiresIn: '15m' });
    let commentId;
    let postId;
    before((done) => {
      const post = new Post({ text: 'testText', author: mongoose.Types.ObjectId() });
      post.save((err, post) => {
        postId = post.id;
        const comment = new Comment({ text: 'testText', author: mongoose.Types.ObjectId(), parent: postId, post: postId });
        comment.save((err, comment) => {
          commentId = comment.id;
          done();
        });
      });
    });
    after((done) => {
      Post.deleteMany({ }, (err) => {
        done();
      });
    });
    after((done) => {
      Comment.deleteMany({ }, (err) => {
        done();
      });
    });

    it('It should not allow unauthenticated users.', (done) => {
      const comment = { text: 'testPost' };
      chai.request(server)
        .post(`/posts/comment/${commentId}`)
        .send(comment)
        .end((err, res) => {
          res.should.have.status(401);
          done();
        });
    });

    it('It should not allow comments on nonexistent comments.', (done) => {
      const comment = { text: 'testText' };
      chai.request(server)
        .post(`/posts/comment/${mongoose.Types.ObjectId()}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(comment)
        .end((err, res) => {
          res.should.have.status(404);
          done();
        });
    });

    it('It should not create a comment without text field', (done) => {
      const comment = { };
      chai.request(server)
        .post(`/posts/comment/${commentId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(comment)
        .end((err, res) => {
          res.should.have.status(400);
          res.body.should.have.property('message').eql('"text" is required');
          done();
        });
    });
    it('It should create a comment whose "parent" field is the given id.', (done) => {
      const comment = { text: 'testText' };
      chai.request(server)
        .post(`/posts/comment/${commentId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(comment)
        .end((err, res) => {
          res.should.have.status(201);
          res.body.should.be.a('object');
          res.body.should.have.property('parent').eql(commentId);
          done();
        });
    });
    it('It should create a comment whose "post" field matches that of the given id.', (done) => {
      const comment = { text: 'testText' };
      chai.request(server)
        .post(`/posts/comment/${commentId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(comment)
        .end((err, res) => {
          res.should.have.status(201);
          res.body.should.be.a('object');
          res.body.should.have.property('post').eql(postId);
          done();
        });
    });
  });

  describe('post /posts/comment/:id/upvote', () => {
    const accessToken = jwt.sign({ username: 'upvoteTest' }, config.secret, { expiresIn: '15m' });
    let comment;
    let user;
    beforeEach((done) => {
      comment = new Comment({ text: 'testText', author: mongoose.Types.ObjectId(), parent: mongoose.Types.ObjectId(), post: mongoose.Types.ObjectId() });
      comment.save((err, comment) => {
        done();
      });
    });
    beforeEach((done) => {
      user = new User({ username: 'upvoteTest', role: Role.User });
      user.save((err, user) => {
        done();
      });
    });
    afterEach((done) => {
      User.deleteMany({ }, (err) => {
        done();
      });
    });
    afterEach((done) => {
      Comment.deleteMany({ }, (err) => {
        done();
      });
    });

    it('It should not allow unauthenticated users.', (done) => {
      chai.request(server)
        .post(`/posts/comment/${comment.id}/upvote`)
        .end((err, res) => {
          res.should.have.status(401);
          done();
        });
    });

    it('It should not upvote nonexistent comments.', (done) => {
      chai.request(server)
        .post(`/posts/comment/${mongoose.Types.ObjectId()}/upvote`)
        .set('Authorization', `Bearer ${accessToken}`)
        .end((err, res) => {
          res.should.have.status(404);
          done();
        });
    });

    describe('When the comment has not been upvoted:', () => {
      it('It should increment the vote count of the comment with the given id.', (done) => {
        comment.votes.should.eql(0);
        chai.request(server)
          .post(`/posts/comment/${comment.id}/upvote`)
          .set('Authorization', `Bearer ${accessToken}`)
          .end((err, res) => {
            res.should.have.status(200);
            res.body.should.be.a('object');
            res.body.should.have.property('votes').eql(1);
            done();
          });
      });

      it("It should append the comment's id to the list of the user's votes.", (done) => {
        comment.should.not.have.property('hasBeenUpvoted');
        chai.request(server)
          .post(`/posts/comment/${comment.id}/upvote`)
          .set('Authorization', `Bearer ${accessToken}`)
          .end((err, res) => {
            res.should.have.status(200);
            res.body.should.be.a('object');
            res.body.should.have.property('hasBeenUpvoted').eql(true);
            done();
          });
      });
    });

    describe('When the comment has already been upvoted:', () => {
      beforeEach((done) => {
        chai.request(server)
          .post(`/posts/comment/${comment.id}/upvote`)
          .set('Authorization', `Bearer ${accessToken}`)
          .end((err, res) => {
            comment = res.body;
            done();
          });
      });

      it('It should have no effect.', (done) => {
        comment.should.have.property('hasBeenUpvoted').eql(true);
        comment.should.have.property('votes').eql(1);
        chai.request(server)
          .post(`/posts/comment/${comment.id}/upvote`)
          .set('Authorization', `Bearer ${accessToken}`)
          .end((err, res) => {
            res.body.should.have.property('hasBeenUpvoted').eql(true);
            res.body.should.have.property('votes').eql(1);
            done();
          });
      });
    });
  });

  describe('post /posts/comment/:id/undo-upvote', () => {
    const accessToken = jwt.sign({ username: 'upvoteTest' }, config.secret, { expiresIn: '15m' });
    let comment;
    let user;
    beforeEach((done) => {
      comment = new Comment({ text: 'testText', author: mongoose.Types.ObjectId(), parent: mongoose.Types.ObjectId(), post: mongoose.Types.ObjectId() });
      comment.save((err, comment) => {
        done();
      });
    });
    beforeEach((done) => {
      user = new User({ username: 'upvoteTest', role: Role.User });
      user.save((err, user) => {
        done();
      });
    });
    afterEach((done) => {
      User.deleteMany({ }, (err) => {
        done();
      });
    });
    afterEach((done) => {
      Post.deleteMany({ }, (err) => {
        done();
      });
    });

    it('It should not allow unauthenticated users.', (done) => {
      chai.request(server)
        .post(`/posts/comment/${comment.id}/undo-upvote`)
        .end((err, res) => {
          res.should.have.status(401);
          done();
        });
    });

    it('It should not affect nonexistent comments.', (done) => {
      chai.request(server)
        .post(`/posts/comment/${mongoose.Types.ObjectId()}/undo-upvote`)
        .set('Authorization', `Bearer ${accessToken}`)
        .end((err, res) => {
          res.should.have.status(404);
          done();
        });
    });

    describe('When the comment has not been upvoted:', () => {
      it('It should have no effect.', (done) => {
        comment.votes.should.eql(0);
        comment.should.not.have.property('hasBeenUpvoted');
        chai.request(server)
          .post(`/posts/comment/${comment.id}/undo-upvote`)
          .set('Authorization', `Bearer ${accessToken}`)
          .end((err, res) => {
            res.should.have.status(200);
            res.body.should.be.a('object');
            res.body.should.have.property('votes').eql(0);
            res.body.should.have.property('hasBeenUpvoted').eql(false);
            done();
          });
      });
    });

    describe('When the comment has been upvoted:', () => {
      beforeEach((done) => {
        chai.request(server)
          .post(`/posts/comment/${comment.id}/upvote`)
          .set('Authorization', `Bearer ${accessToken}`)
          .end((err, res) => {
            comment = res.body;
            done();
          });
      });

      it('It should decrement the number of votes on the given comment.', (done) => {
        comment.should.have.property('votes').eql(1);
        chai.request(server)
          .post(`/posts/comment/${comment.id}/undo-upvote`)
          .set('Authorization', `Bearer ${accessToken}`)
          .end((err, res) => {
            res.body.should.have.property('votes').eql(0);
            done();
          });
      });
      it("It should remove the post from the user's list of votes.", (done) => {
        comment.should.have.property('hasBeenUpvoted').eql(true);
        chai.request(server)
          .post(`/posts/comment/${comment.id}/undo-upvote`)
          .set('Authorization', `Bearer ${accessToken}`)
          .end((err, res) => {
            res.body.should.have.property('hasBeenUpvoted').eql(false);
            done();
          });
      });
    });
  });
});
