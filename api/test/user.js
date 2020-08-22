/* eslint-disable no-undef, no-shadow, import/no-extraneous-dependencies, object-curly-newline */
process.env.NODE_ENV = 'test';

const chai = require('chai');
const chaiHttp = require('chai-http');
const jwt = require('jsonwebtoken');
const config = require('config');
const mongoose = require('mongoose');

const User = require('../user.model');
const Role = require('../helpers/role');
const server = require('../server');
const { Post } = require('../helpers/db');

const should = chai.should(); // eslint-disable-line no-unused-vars

chai.use(chaiHttp);

describe('Users', () => {
  beforeEach((done) => {
    User.deleteMany({ }, (err) => {
      done();
    });
  });
  beforeEach((done) => {
    Post.deleteMany({ }, (err) => {
      done();
    });
  });

  describe('get /users', () => {
    const accessToken = jwt.sign({ username: 'test' }, config.secret, { expiresIn: '15m' });
    beforeEach((done) => {
      const user = new User({ username: 'test', role: Role.Admin });
      user.save((err, user) => {
        done();
      });
    });

    it('It should not allow unauthenticated users.', (done) => {
      chai.request(server)
        .get('/users')
        .end((err, res) => {
          res.should.have.status(401);
          done();
        });
    });

    it('It should not allow users with a role other than Admin.', (done) => {
      const userRoleAccessToken = jwt.sign({ username: 'testUserRole' }, config.secret, { expiresIn: '15m' });
      beforeEach((done) => {
        const user = new User({ username: 'testUserRole', role: Role.User });
        user.save((err, user) => {
          done();
        });
      });

      chai.request(server)
        .get('/users')
        .set('Authorization', `Bearer ${userRoleAccessToken}`)
        .end((err, res) => {
          res.should.have.status(401);
          done();
        });
    });

    it('It should return an array of users.', (done) => {
      chai.request(server)
        .get('/users')
        .set('Authorization', `Bearer ${accessToken}`)
        .end((err, res) => {
          res.should.have.status(200);
          res.body.should.be.a('array');
          done();
        });
    });

    it('It should include private user information', (done) => {
      chai.request(server)
        .get('/users')
        .set('Authorization', `Bearer ${accessToken}`)
        .end((err, res) => {
          res.body[0].should.have.property('id');
          res.body[0].should.have.property('role');
          res.body[0].should.have.property('votes');
          done();
        });
    });

    describe('When there are no users besides the requester:', () => {
      it('It should return an array of length 1.', (done) => {
        chai.request(server)
          .get('/users')
          .set('Authorization', `Bearer ${accessToken}`)
          .end((err, res) => {
            res.body.length.should.be.eql(1);
            done();
          });
      });
    });
    describe('When there are other users:', () => {
      beforeEach((done) => {
        const users = [
          { username: 'test1', role: Role.User },
          { username: 'test2', role: Role.Admin },
          { username: 'test3', role: Role.User },
        ];
        User.insertMany(users, (err, users) => {
          done();
        });
      });

      it('It should return all users', (done) => {
        chai.request(server)
          .get('/users')
          .set('Authorization', `Bearer ${accessToken}`)
          .end((err, res) => {
            res.body.length.should.be.eql(4);
            done();
          });
      });
    });
  });

  describe('get /users/user', () => {
    const accessToken = jwt.sign({ username: 'test' }, config.secret, { expiresIn: '15m' });
    beforeEach((done) => {
      const user = new User({ username: 'test', role: Role.User });
      user.save((err, user) => {
        done();
      });
    });

    it('It should not allow unauthenticated users.', (done) => {
      chai.request(server)
        .get('/users/user')
        .end((err, res) => {
          res.should.have.status(401);
          done();
        });
    });

    it('It should return a user.', (done) => {
      chai.request(server)
        .get('/users/user')
        .set('Authorization', `Bearer ${accessToken}`)
        .end((err, res) => {
          res.should.have.status(200);
          res.body.should.be.a('object');
          res.body.should.have.property('username');
          done();
        });
    });

    it('It should return the user that has the username specified in the access token.', (done) => {
      chai.request(server)
        .get('/users/user')
        .set('Authorization', `Bearer ${accessToken}`)
        .end((err, res) => {
          res.body.should.have.property('username').eql('test');
          done();
        });
    });

    it('It should include private user information.', (done) => {
      chai.request(server)
        .get('/users/user')
        .set('Authorization', `Bearer ${accessToken}`)
        .end((err, res) => {
          res.body.should.have.property('id');
          res.body.should.have.property('role');
          res.body.should.have.property('votes');
          done();
        });
    });
  });

  describe('get /users/user/:username', () => {
    const username = 'test';
    beforeEach((done) => {
      const user = new User({ username: 'test', role: Role.User });
      user.save((err, user) => {
        done();
      });
    });

    it('It should return 404 if the user does not exist', (done) => {
      chai.request(server)
        .get('/users/user/nonExistentUser')
        .end((err, res) => {
          res.should.have.status(404);
          done();
        });
    });

    it('It should return a user.', (done) => {
      chai.request(server)
        .get(`/users/user/${username}`)
        .end((err, res) => {
          res.should.have.status(200);
          res.body.should.be.a('object');
          res.body.should.have.property('username');
          done();
        });
    });

    it('It should return the user with the given username.', (done) => {
      chai.request(server)
        .get(`/users/user/${username}`)
        .end((err, res) => {
          res.body.should.have.property('username').eql(username);
          done();
        });
    });

    it('It should not include private user information.', (done) => {
      chai.request(server)
        .get(`/users/user/${username}`)
        .end((err, res) => {
          res.body.should.not.have.property('id');
          res.body.should.not.have.property('role');
          res.body.should.not.have.property('votes');
          done();
        });
    });
  });

  describe('get /users/user/:username/posts', () => {
    const username = 'test';
    const accessToken = jwt.sign({ username }, config.secret, { expiresIn: '15m' });
    beforeEach((done) => {
      const user = new User({ username, role: Role.User });
      user.save((err, user) => {
        const posts = [
          { author: user.id, text: 'testText1' },
          { author: user.id, text: 'testText2' },
          { author: user.id, text: 'testText3' },
          { author: mongoose.Types.ObjectId(), text: 'testText4' },
        ];
        Post.insertMany(posts, (err, posts) => {
          done();
        });
      });
    });

    it('It should return 404 if the specified user does not exist.', (done) => {
      chai.request(server)
        .get(`/users/user/${mongoose.Types.ObjectId()}/posts`)
        .end((err, res) => {
          res.should.have.status(404);
          done();
        });
    });

    it('It should return a list of posts.', (done) => {
      chai.request(server)
        .get(`/users/user/${username}/posts`)
        .end((err, res) => {
          res.should.have.status(200);
          res.body.should.be.a('array');
          done();
        });
    });

    it('It should return all posts whose author is the specified user.', (done) => {
      chai.request(server)
        .get(`/users/user/${username}/posts`)
        .end((err, res) => {
          res.body.length.should.be.eql(3);
          done();
        });
    });

    it('It should not include information regarding the requesting user if user is not authenticated.', (done) => {
      chai.request(server)
        .get(`/users/user/${username}/posts`)
        .end((err, res) => {
          res.body[0].should.not.have.property('hasBeenUpvoted');
          done();
        });
    });

    it('It should include information regarding the requesting user if user is authenticated.', (done) => {
      chai.request(server)
        .get(`/users/user/${username}/posts`)
        .set('Authorization', `Bearer ${accessToken}`)
        .end((err, res) => {
          res.body[0].should.have.property('hasBeenUpvoted');
          done();
        });
    });
  });

  describe('put /users/user', () => {
    const username = 'testUser';
    const accessToken = jwt.sign({ username }, config.secret, { expiresIn: '15m' });
    let user;
    beforeEach((done) => {
      user = new User({ username, role: Role.User });
      user.save((err, user) => {
        done();
      });
    });

    it('It should not allow unauthenticated users.', (done) => {
      chai.request(server)
        .put('/users/user')
        .end((err, res) => {
          res.should.have.status(401);
          done();
        });
    });

    it('It should return the updated user.', (done) => {
      const updateParams = {
        description: 'new description',
      };
      chai.request(server)
        .put('/users/user')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(updateParams)
        .end((err, res) => {
          res.body.should.be.a('object');
          res.body.should.have.property('description').eql('new description');
          done();
        });
    });
  });
});
