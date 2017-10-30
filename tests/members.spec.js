'use strict';

process.env.NODE_ENV = 'testing';
const SERVER_URL = 'http://localhost:3000/api/v0/';

const path = require('path');
const app = require('../server/server');
const chai = require('chai');

const UserHelper = require('./helpers/user-helper');

chai.should();

describe('Members', () => {
  let users = null;
  let server = null;

  beforeEach(async () => {
    server = await app.listen();
    users = await UserHelper.CreateInstances(app);
  });

  afterEach(async () => {
    await app.models.User.destroyAll();
    await app.models.Group.destroyAll();
    await server.close();
  });

  it('Should be able to list his groups', async () => {
    await Promise.all(
      users.map(async user => {
        const owner = new UserHelper(SERVER_URL, user);

        await owner.createGroup('test');
        const groups = await owner.getGroups();

        groups[0].should.contain({name: `${user.username}/test`});
      })
    );
  });

  it('Should not be able to list groups in which he is not a member', async () => {
    await Promise.all(
      users.map(async user => {
        const helper = new UserHelper(SERVER_URL, user);

        await helper.createGroup('test');
        const groups = await helper.getGroups();

        groups[0].should.contain({name: `${user.username}/test`});
      })
    );
  });

  it('Should be able to get members from a group he belongs', async () => {
    const owner = new UserHelper(SERVER_URL, users[0]);
    const member1 = new UserHelper(SERVER_URL, users[1]);
    const member2 = new UserHelper(SERVER_URL, users[2]);

    const group = await owner.createGroup('test');
    group.addMember(member1);
    group.addMember(member2);
    const memberGroup = member1.attachGroup(group);

    const members = await memberGroup.getMembers();

    members.should.have.lengthOf(3);
  });
});
