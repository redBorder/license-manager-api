'use strict';

process.env.NODE_ENV = 'testing';
const SERVER_URL = 'http://localhost:3000/api/v0/';

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

describe('Groups', () => {
  const Group = app.models.Group;
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
  let groupId = null;

  beforeEach(async () => {
    server = await app.listen();
    const createdUsers = await app.models.User.create(users);
    createdUsers.map(async user => {
      await user.verify({
        type: 'email',
        from: 'test',
        mailer: MockMailer,
      });
      await User.confirm(user.id, user.verificationToken, '');
    });
  });

  afterEach(async () => {
    await app.models.User.destroyAll();
    await server.close();
  });

  it('The owner should be listed as member', async () => {
    await Promise.all(
      users.map(async user => {
        let res = await chai
          .request(SERVER_URL)
          .post('users/login')
          .send({email: user.email, password: user.password});

        res.should.have.status(200);
        const authToken = res.body.id;
        const userId = res.body.userId;

        // Create a group
        res = await chai
          .request(SERVER_URL)
          .post(`users/${userId}/groups`)
          .set('Authorization', authToken);

        // List members
        res = await chai
          .request(SERVER_URL)
          .get(`groups/${res.body.id}/members`)
          .set('Authorization', authToken);

        res.body.length.should.equal(1);
        res.body[0].should.include({email: user.email});
      })
    );
  });

  it('The owner should be able to manage members', async () => {
    const owner = users[0];
    const member = users[1];

    // Login
    let res = await chai
      .request(SERVER_URL)
      .post('users/login')
      .send({email: owner.email, password: owner.password});

    res.should.have.status(200);
    const authToken = res.body.id;
    const ownerId = res.body.userId;

    // Create a group
    res = await chai
      .request(SERVER_URL)
      .post(`users/${ownerId}/groups`)
      .set('Authorization', authToken);

    groupId = res.body.id;

    // Add a member to the group
    await chai
      .request(SERVER_URL)
      .post(`groups/${groupId}/add-member`)
      .set('Authorization', authToken)
      .send({email: member.email});

    res = await chai
      .request(SERVER_URL)
      .get(`groups/${ownerId}/members`)
      .set('Authorization', authToken);

    res.body.length.should.equal(2);
    res.body[0].should.include({email: owner.email});
    res.body[1].should.include({email: member.email});

    // Remove member
    await chai
      .request(SERVER_URL)
      .post(`groups/${groupId}/remove-member`)
      .set('Authorization', authToken)
      .send({email: member.email});

    res = await chai
      .request(SERVER_URL)
      .get(`groups/${ownerId}/members`)
      .set('Authorization', authToken);

    res.body.length.should.equal(1);
    res.body[0].should.include({email: owner.email});
  });
});
