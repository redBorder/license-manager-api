'use strict';

process.env.NODE_ENV = 'testing';
const SERVER_URL = 'http://localhost:3000/api/v0/';

const path = require('path');
const app = require('../server/server');
const chai = require('chai');
const chaiHttp = require('chai-http');

const UserHelper = require('./helpers/user-helper');

chai.should();
chai.use(chaiHttp);

describe('User', () => {
  const User = app.models.User;

  let server = null;

  beforeEach(async () => {
    server = await app.listen();
  });

  afterEach(async () => {
    await User.destroyAll();
    await server.close();
  });

  it('Should be created', async () => {
    const res = await chai
      .request(SERVER_URL)
      .post('users')
      .send({
        email: 'test1@test.com',
        username: 'test1',
        firstName: 'John',
        lastName: 'Doe',
        password: '12345678',
      });

    res.should.have.status(200);
    res.body.should.contain({
      email: 'test1@test.com',
      username: 'test1',
      firstName: 'John',
      lastName: 'Doe',
    });
  });

  it('Should not be able to login yet', async () => {
    try {
      await chai
        .request(SERVER_URL)
        .post('users/login')
        .send({
          email: 'test1@test.com',
          password: '12345678',
        });
    } catch (err) {
      err.should.have.status(401);
    }
  });

  it('Should be able to login once confirmed', async () => {
    const user = (await chai
      .request(SERVER_URL)
      .post('users')
      .send({
        email: 'test1@test.com',
        username: 'test1',
        firstName: 'John',
        lastName: 'Doe',
        password: '12345678',
      })).body;

    let instance = await User.findById(user.id);
    let res = await chai
      .request(SERVER_URL)
      .get('users/confirm')
      .query({
        uid: instance.id,
        token: instance.verificationToken,
      });

    instance = await User.findById(user.id);
    instance.emailVerified.should.equal(true);

    res = await chai
      .request(SERVER_URL)
      .post('users/login')
      .send({
        email: 'test1@test.com',
        password: '12345678',
      });

    res.status.should.equal(200);
  });
});
