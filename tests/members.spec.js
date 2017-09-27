'use strict';

process.env.NODE_ENV = 'testing';
const SERVER_URL = 'http://localhost:3000/api/v0/';

const path = require('path');
const app = require('../server/server');
const chai = require('chai');
const TestHelpers = require('./test-helpers');

chai.should();

describe('Members', () => {
  const User = app.models.User;
  const users = [
    {
      email: 'test1@test.com',
      username: 'test1',
      firstName: 'John',
      lastName: 'Doe',
      password: '12345678',
    },
    {
      email: 'test2@test.com',
      username: 'test2',
      firstName: 'Jack',
      lastName: 'Bauer',
      password: '87654321',
    },
    {
      email: 'test3@test.com',
      username: 'test3',
      firstName: 'Whoopi',
      lastName: 'Goldberg',
      password: '777777777',
    },
  ];

  let usersInstances = null;
  let server = null;

  beforeEach(async () => {
    server = await app.listen();

    usersInstances = await app.models.User.create(users);
    await Promise.all(
      usersInstances.map(user =>
        user.verify(
          {
            type: 'email',
            from: 'test',
            mailer: TestHelpers.MockMailer,
          },
          () => User.confirm(user.id, user.verificationToken, '')
        )
      )
    );

    const authTokens = await Promise.all(
      usersInstances.map(user => user.accessTokens.create())
    );

    authTokens.forEach(
      (authToken, index) => (usersInstances[index].authToken = authToken)
    );
  });

  afterEach(async () => {
    await app.models.User.destroyAll();
    await app.models.Group.destroyAll();
    await server.close();
  });

  it('Should be able to list his groups', async () => {
    await Promise.all(
      usersInstances.map(async user => {
        const helper = new TestHelpers.UserHelper(SERVER_URL, user);

        await helper.createGroup('test');
        const groups = await helper.getGroups();
        groups[0].should.contain({name: `${user.username}/test`});
      })
    );
  });

  it('Should not be able to list groups in which he is not a \
member', async () => {
    await Promise.all(
      usersInstances.map(async user => {
        const helper = new TestHelpers.UserHelper(SERVER_URL, user);

        await helper.createGroup('test');
        const groups = await helper.getGroups();
        groups[0].should.contain({name: `${user.username}/test`});
      })
    );
  });
});
