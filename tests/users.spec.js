'use strict';

process.env.NODE_ENV = 'testing';

const async = require('async');
const app = require('../server/server');
const chai = require('chai');
const chaiHttp = require('chai-http');
chai.should();

chai.use(chaiHttp);

describe('User', () => {
  let server;
  const users = [
    {email: 'test1@test.com', password: '12345678'},
    {email: 'test2@test.com', password: '87654321'},
  ];

  beforeEach(done => {
    server = app.listen(done);
  });

  afterEach(done => {
    server.close(done);
  });

  it('Should be able to be created', done => {
    async.map(
      users,
      (user, cb) => {
        chai
          .request('http://localhost:3000/api/v0/')
          .post('users')
          .send({
            email: user.email,
            password: user.password,
          })
          .end((err, res) => {
            if (err) throw Error(err);
            cb();
          });
      },
      err => {
        if (err) throw Error(err);
        done();
      }
    );
  });

  it('Should log be able to login', done => {
    async.map(
      users,
      (user, cb) => {
        chai
          .request('http://localhost:3000/api/v0/')
          .post('users/login')
          .send({
            email: user.email,
            password: user.password,
          })
          .end((err, res) => {
            if (err) throw Error(err);

            res.should.have.status(200);
            res.body.should.have.property('id');
            res.body.should.have.property('userId');
            res.body.should.have.property('ttl');
            res.body.should.have.property('created');

            user.userToken = res.body.id;
            user.userId = res.body.userId;
            cb();
          });
      },
      err => {
        if (err) throw Error(err);
        done();
      }
    );
  });

  it('Should be able to create groups', done => {
    async.map(
      users,
      (user, cb) => {
        chai
          .request('http://localhost:3000/api/v0/')
          .post(`users/${user.userId}/groups`)
          .set('Authorization', user.userToken)
          .end((err, res) => {
            if (err) throw Error(err);

            res.should.have.status(200);
            res.body.should.have.property('id');
            res.body.should.have.property('ownerId', user.userId);
            cb();
          });
      },
      err => {
        if (err) throw Error(err);
        done();
      }
    );
  });

  it('Should be able to list his groups', done => {
    async.map(
      users,
      (user, cb) => {
        chai
          .request('http://localhost:3000/api/v0/')
          .get(`users/${user.userId}/groups`)
          .set('Authorization', user.userToken)
          .end((err, res) => {
            if (err) throw Error(err);

            res.should.have.status(200);
            res.body.should.be.a('array');
            res.body.should.have.lengthOf(1);
            res.body[0].should.have.property('id');
            res.body[0].should.have.property('ownerId', user.userId);
            cb();
          });
      },
      err => {
        if (err) throw Error(err);
        done();
      }
    );
  });

  it('Should not be able to list others users groups', done => {
    async.map(
      users,
      (user, cb) => {
        chai
          .request('http://localhost:3000/api/v0/')
          .get(`users/${user.userId + 1}/groups`)
          .set('Authorization', user.userToken)
          .end((err, res) => {
            err.toString().should.equal('Error: Unauthorized');
            res.should.have.status(401);
            cb();
          });
      },
      err => {
        if (err) throw Error(err);
        done();
      }
    );
  });
});
