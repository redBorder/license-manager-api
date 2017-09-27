'use strict';

process.env.NODE_ENV = 'testing';
const SERVER_URL = 'http://localhost:3000/api/v0/';

const path = require('path');
const app = require('../server/server');
const chai = require('chai');
const chaiHttp = require('chai-http');
const TestHelpers = require('./test-helpers');
const TestFixtures = require('./test-fixtures');

const fixtures = new TestFixtures();

chai.should();
chai.use(chaiHttp);

describe('User', () => {
  const User = app.models.User;

  let server = null;
  let users = fixtures.getUsers();

  before(async () => {
    server = await app.listen();
  });

  after(async () => {
    await app.models.User.destroyAll();
    await server.close();
  });

  it('Should be created', async () => {
    await Promise.all(
      users.map(async user => {
        const res = await chai
          .request(SERVER_URL)
          .post('users')
          .send(user);

        user.id = res.body.id;

        res.should.have.status(200);
        Object.entries(user).forEach(([key, value]) => {
          if (res.body[key]) {
            res.body[key].should.equal(value);
          }
        });
      })
    );
  });

  it('Should not be able to login yet', async () => {
    await Promise.all(
      users.map(async user => {
        try {
          await chai
            .request(SERVER_URL)
            .post('users/login')
            .send(user);
        } catch (err) {
          err.should.have.status(401);
        }
      })
    );
  });

  it('Should be confirmed', async () => {
    await Promise.all(
      users.map(async user => {
        const userInstance = await User.findById(user.id);
        await userInstance.verify({
          type: 'email',
          from: 'test',
          mailer: TestHelpers.MockMailer,
        });

        await User.confirm(userInstance.id, userInstance.verificationToken, '');
      })
    );
  });

  it('Should be able to login once is verified', async () => {
    await Promise.all(
      users.map(async user => {
        const res = await chai
          .request(SERVER_URL)
          .post('users/login')
          .send({
            email: user.email,
            password: user.password,
          });

        res.should.have.status(200);
        res.body.should.have.property('id');
        res.body.should.have.property('userId');
        res.body.should.have.property('ttl');
        res.body.should.have.property('created');

        user.userToken = res.body.id;
        user.userId = res.body.userId;
      })
    );
  });
});
