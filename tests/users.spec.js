'use strict';

process.env.NODE_ENV = 'testing';
const SERVER_URL = 'http://localhost:3000/api/v0/';

const path = require('path');
const app = require('../server/server');
const chai = require('chai');
const chaiHttp = require('chai-http');

chai.should();
chai.use(chaiHttp);

class MockMailer {
  static send(options, context, cb) {
    cb(null, null);
  }
}

describe('User', () => {
  const User = app.models.User;
  const users = [
    {
      email: 'test1@test.com',
      firstName: 'John',
      lastName: 'Doe',
      password: '12345678',
    },
    {
      email: 'test2@test.com',
      firstName: 'Jack',
      lastName: 'Bauer',
      password: '87654321',
    },
    {
      email: 'test3@test.com',
      firstName: 'Whoopi',
      lastName: 'Goldberg',
      password: '777777777',
    },
  ];

  let server = null;

  beforeEach(done => {
    server = app.listen(done);
  });

  afterEach(done => {
    server.close(done);
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
            .send({
              email: user.email,
              password: user.password,
            });
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
          mailer: MockMailer,
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

  it('Should be able to create groups', async () => {
    await Promise.all(
      users.map(async user => {
        const res = await chai
          .request(SERVER_URL)
          .post(`users/${user.userId}/groups`)
          .set('Authorization', user.userToken);

        res.should.have.status(200);
        res.body.should.have.property('id');
        res.body.should.have.property('ownerId', user.userId);
      })
    );
  });

  it('Should be able to list his groups', async () => {
    await Promise.all(
      users.map(async user => {
        const res = await chai
          .request(SERVER_URL)
          .get(`users/${user.userId}/groups`)
          .set('Authorization', user.userToken);

        res.should.have.status(200);
        res.body.should.be.a('array');
        res.body.should.have.lengthOf(1);
        res.body[0].should.have.property('id');
        res.body[0].should.have.property('ownerId', user.userId);
      })
    );
  });

  it('Should not be able to list others users groups', async () => {
    await Promise.all(
      users.map(async user => {
        try {
          const res = await chai
            .request(SERVER_URL)
            .get(`users/${user.userId + 1}/groups`)
            .set('Authorization', user.userToken);

          res.should.have.status(401);
        } catch (err) {
          err.toString().should.equal('Error: Unauthorized');
        }
      })
    );
  });
});
