'use strict';

process.env.NODE_ENV = 'testing';
const SERVER_URL = 'http://localhost:3000/api/v0/';

const app = require('../server/server');
const chai = require('chai');
const TestHelpers = require('./test-helpers');

describe('Groups', () => {
  const Group = app.models.Group;
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
  const owner = users[0];
  const member = users[1];

  let server = null;
  let usersInstances = null;

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

  it('Users should be able to create groups', async () => {
    const owner = usersInstances[0];
    const helper = new TestHelpers.UserHelper(SERVER_URL, owner);
    const group = await helper.createGroup('test');
    group.should.not.equal(undefined || null);
  });

  it('The owner should be able to add admins', async () => {
    const owner = usersInstances[0];
    const admin = usersInstances[1];

    const helper = new TestHelpers.UserHelper(SERVER_URL, owner);

    await helper.createGroup('test');
    await helper.addAdmin(admin);
    const members = await helper.getMembers();
    const admins = await helper.getAdmins();

    members.length.should.equal(2);
    admins.length.should.equal(2);

    members[0].should.include({
      email: owner.email,
    });
    members[1].should.include({
      email: admin.email,
    });

    admins[0].should.include({
      email: owner.email,
    });
    admins[1].should.include({
      email: admin.email,
    });
  });

  it('The owner should be able to add members', async () => {
    const owner = usersInstances[0];
    const member = usersInstances[2];

    const helper = new TestHelpers.UserHelper(SERVER_URL, owner);

    await helper.createGroup('test');
    await helper.addMember(member);
    const members = await helper.getMembers();

    members.length.should.equal(2);

    members[0].should.include({
      email: owner.email,
    });
    members[1].should.include({
      email: member.email,
    });
  });

  it('The owner should be able to remove members', async () => {
    const owner = usersInstances[0];
    const member = usersInstances[1];

    const helper = new TestHelpers.UserHelper(SERVER_URL, owner);

    await helper.createGroup('test');
    await helper.addMember(member);
    await helper.removeMember(member);
    const members = await helper.getMembers();

    members.length.should.equal(1);
    members[0].should.include({
      email: owner.email,
    });
  });

  it('The owner should be able to remove admins', async () => {
    const owner = usersInstances[0];
    const admin = usersInstances[1];

    const helper = new TestHelpers.UserHelper(SERVER_URL, owner);

    await helper.createGroup('test');
    await helper.addAdmin(admin);
    await helper.removeAdmin(admin);
    const admins = await helper.getAdmins();
    const members = await helper.getMembers();

    admins.length.should.equal(1);
    admins[0].should.include({
      email: owner.email,
    });

    members.length.should.equal(2);
    members[0].should.include({
      email: owner.email,
    });
    members[1].should.include({
      email: admin.email,
    });
  });

  it('An admin should be able to add members', async () => {
    const owner = usersInstances[0];
    const admin = usersInstances[1];
    const member = usersInstances[2];

    const helper = new TestHelpers.UserHelper(SERVER_URL, owner);

    const group = await helper.createGroup('test');
    await helper.addAdmin(admin);

    const adminHelper = new TestHelpers.UserHelper(SERVER_URL, admin);
    await adminHelper.setGroup(group);
    await adminHelper.addMember(member);

    const members = await helper.getMembers();
    members.length.should.equal(3);
    members[0].should.include({
      email: owner.email,
    });
    members[1].should.include({
      email: admin.email,
    });
    members[2].should.include({
      email: member.email,
    });
  });

  it('An admin should be able to remove members', async () => {
    const owner = usersInstances[0];
    const admin = usersInstances[1];
    const member = usersInstances[2];

    const helper = new TestHelpers.UserHelper(SERVER_URL, owner);

    const group = await helper.createGroup('test');
    await helper.addAdmin(admin);
    await helper.addMember(member);

    const adminHelper = new TestHelpers.UserHelper(SERVER_URL, admin);
    await adminHelper.setGroup(group);
    await adminHelper.removeMember(member);

    const members = await helper.getMembers();
    members.length.should.equal(2);
    members[0].should.include({
      email: owner.email,
    });
    members[1].should.include({
      email: admin.email,
    });
  });
});
