'use strict';

process.env.NODE_ENV = 'testing';
const SERVER_URL = 'http://localhost:3000/api/v0/';

const app = require('../server/server');
const chai = require('chai');
const UserHelper = require('./helpers/user-helper');

describe('Groups', () => {
  let server = null;
  let users = null;

  beforeEach(async () => {
    server = await app.listen();
    users = await UserHelper.CreateInstances(app);
  });

  afterEach(async () => {
    await app.models.User.destroyAll();
    await app.models.Group.destroyAll();
    await server.close();
  });

  it('Users should be able to create groups', async () => {
    const helper = new UserHelper(SERVER_URL, users[0]);
    const group = await helper.createGroup('test');
    group.getInstance().should.not.equal(undefined || null);
  });

  it('The owner should be able to add admins', async () => {
    const owner = new UserHelper(SERVER_URL, users[0]);
    const admin = new UserHelper(SERVER_URL, users[1]);

    const group = await owner.createGroup('test');
    await group.addAdmin(admin);

    const members = await group.getMembers();
    const admins = await group.getAdmins();

    members.length.should.equal(2);
    admins.length.should.equal(2);

    members[0].should.include({
      email: owner.getInstance().email,
    });
    members[1].should.include({
      email: admin.getInstance().email,
    });

    admins[0].should.include({
      email: owner.getInstance().email,
    });
    admins[1].should.include({
      email: admin.getInstance().email,
    });
  });

  it('The owner should be able to add members', async () => {
    const owner = new UserHelper(SERVER_URL, users[0]);
    const member = new UserHelper(SERVER_URL, users[2]);

    const group = await owner.createGroup('test');
    await group.addMember(member);
    const members = await group.getMembers();

    members.length.should.equal(2);

    members[0].should.include({
      email: owner.getInstance().email,
    });
    members[1].should.include({
      email: member.getInstance().email,
    });
  });

  it('The owner should be able to remove members', async () => {
    const owner = new UserHelper(SERVER_URL, users[0]);
    const member = new UserHelper(SERVER_URL, users[2]);

    const group = await owner.createGroup('test');
    await group.addMember(member);

    await group.removeMember(member);
    const members = await group.getMembers();

    members.length.should.equal(1);
    members[0].should.include({
      email: owner.getInstance().email,
    });
  });

  it('The owner should be able to remove admins', async () => {
    const owner = new UserHelper(SERVER_URL, users[0]);
    const admin = new UserHelper(SERVER_URL, users[1]);

    const group = await owner.createGroup('test');
    await group.addAdmin(admin);

    await group.removeAdmin(admin);
    const admins = await group.getAdmins();
    const members = await group.getMembers();

    admins.length.should.equal(1);
    admins[0].should.include({
      email: owner.getInstance().email,
    });
    members.length.should.equal(2);
    members[0].should.include({
      email: owner.getInstance().email,
    });
    members[1].should.include({
      email: admin.getInstance().email,
    });
  });

  it('An admin should be able to add members', async () => {
    const owner = new UserHelper(SERVER_URL, users[0]);
    const admin = new UserHelper(SERVER_URL, users[1]);
    const member = new UserHelper(SERVER_URL, users[2]);

    const group = await owner.createGroup('test');
    await group.addAdmin(admin);
    const adminGroup = admin.attachGroup(group);

    await adminGroup.addMember(member);
    const members = await group.getMembers();

    members.length.should.equal(3);
    members[0].should.include({
      email: owner.getInstance().email,
    });
    members[1].should.include({
      email: admin.getInstance().email,
    });
    members[2].should.include({
      email: member.getInstance().email,
    });
  });

  it('An admin should be able to remove members', async () => {
    const owner = new UserHelper(SERVER_URL, users[0]);
    const admin = new UserHelper(SERVER_URL, users[1]);
    const member = new UserHelper(SERVER_URL, users[2]);

    const group = await owner.createGroup('test');
    await group.addAdmin(admin);
    await group.addMember(member);

    const adminGroup = await admin.attachGroup(group);
    await adminGroup.removeMember(member);
    const members = await group.getMembers();

    members.length.should.equal(2);
    members[0].should.include({
      email: owner.getInstance().email,
    });
    members[1].should.include({
      email: admin.getInstance().email,
    });
  });
});
