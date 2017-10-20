'use strict';

process.env.NODE_ENV = 'testing';
const SERVER_URL = 'http://localhost:3000/api/v0/';

const app = require('../server/server');
const chai = require('chai');
const _ = require('lodash');

const TestHelpers = require('./test-helpers');
const UsersFixtures = require('./test-fixtures').users;

describe('Organizations', () => {
  const Group = app.models.Group;
  const User = app.models.User;
  const users = UsersFixtures.getUsers();

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
    await app.models.Cluster.destroyAll();
    await app.models.Organization.destroyAll();
    await server.close();
  });

  it('The owner not should be able to create organizations in a global mode cluster', async () => {
    const owner = new TestHelpers.UserHelper(SERVER_URL, usersInstances[0]);

    await owner.createGroup('test');
    const cluster = await owner.createCluster('test', true);

    try {
      await owner.createOrganization('test', cluster);
    } catch (err) {
      err.should.have.status(500);
    }
  });

  it('The owner should be able to create organizations in a cluster', async () => {
    const organizationsUuids = ['Org1', 'Org2', 'Org3'];
    const owner = new TestHelpers.UserHelper(SERVER_URL, usersInstances[0]);

    await owner.createGroup('test');
    const cluster = await owner.createCluster('test', false);
    await Promise.all(
      organizationsUuids.map(org => owner.createOrganization(org, cluster))
    );

    const orgs = await owner.getOrganizations();
    const pairs = _.zip(organizationsUuids, orgs);
    const errors = pairs
      .map(([uuid, organization]) => organization === uuid)
      .reduce((prev, curr) => prev && curr);
    orgs.should.have.length(3);
    errors.should.equal(false);
  });

  it('The owner should be able to remove organizations from a cluster', async () => {
    const organizationsUuids = ['Org1', 'Org2', 'Org3'];
    const owner = new TestHelpers.UserHelper(SERVER_URL, usersInstances[0]);

    await owner.createGroup('test');
    const cluster = await owner.createCluster('test', false);
    const orgs = await Promise.all(
      organizationsUuids.map(org => owner.createOrganization(org, cluster))
    );
    await Promise.all(orgs.map(org => owner.removeOrganization(org)));

    const organizations = await owner.getOrganizations();
    organizations.should.have.length(0);
  });

  it('An admin should be able to list organizations in a cluster', async () => {
    const organizationsUuids = ['Org1', 'Org2', 'Org3'];
    const owner = new TestHelpers.UserHelper(SERVER_URL, usersInstances[0]);
    const admin = new TestHelpers.UserHelper(SERVER_URL, usersInstances[1]);

    const group = await owner.createGroup('test');
    const cluster = await owner.createCluster('test', false);
    await Promise.all(
      organizationsUuids.map(org => owner.createOrganization(org, cluster))
    );
    await owner.addAdmin(usersInstances[1]);
    admin.setGroup(group);

    const organizations = await admin.getOrganizations();
    organizations.should.have.length(3);
  });

  it('An admin should be able to create organizations in a cluster', async () => {
    const organizationsUuids = ['Org1', 'Org2', 'Org3'];
    const owner = new TestHelpers.UserHelper(SERVER_URL, usersInstances[0]);
    const admin = new TestHelpers.UserHelper(SERVER_URL, usersInstances[1]);

    const group = await owner.createGroup('test');
    const cluster = await owner.createCluster('test', false);
    await owner.addAdmin(usersInstances[1]);
    admin.setGroup(group);
    const orgs = await Promise.all(
      organizationsUuids.map(org => admin.createOrganization(org, cluster))
    );

    const pairs = _.zip(organizationsUuids, orgs);
    const errors = pairs
      .map(([uuid, organization]) => organization === uuid)
      .reduce((prev, curr) => prev && curr);
    orgs.should.have.length(3);
    errors.should.equal(false);
  });

  it('An admin should be able to remove organizations from a cluster', async () => {
    const organizationsUuids = ['Org1', 'Org2', 'Org3'];
    const owner = new TestHelpers.UserHelper(SERVER_URL, usersInstances[0]);
    const admin = new TestHelpers.UserHelper(SERVER_URL, usersInstances[1]);

    const group = await owner.createGroup('test');
    const cluster = await owner.createCluster('test', false);
    const orgs = await Promise.all(
      organizationsUuids.map(org => owner.createOrganization(org, cluster))
    );
    await owner.addAdmin(usersInstances[1]);
    admin.setGroup(group);
    await Promise.all(orgs.map(org => admin.removeOrganization(org)));

    const organizations = await admin.getOrganizations();
    organizations.should.have.length(0);
  });

  it('A member should be able to list organizations in a cluster', async () => {
    const organizationsUuids = ['Org1', 'Org2', 'Org3'];
    const owner = new TestHelpers.UserHelper(SERVER_URL, usersInstances[0]);
    const member = new TestHelpers.UserHelper(SERVER_URL, usersInstances[2]);

    const group = await owner.createGroup('test');
    const cluster = await owner.createCluster('test', false);
    const orgs = await Promise.all(
      organizationsUuids.map(org => owner.createOrganization(org, cluster))
    );
    await owner.addMember(usersInstances[2]);
    member.setGroup(group);

    const organizations = await member.getOrganizations();
    organizations.should.have.length(3);
  });

  it('A member should not be able to create organizations in a cluster', async () => {
    const organizationsUuids = ['Org1', 'Org2', 'Org3'];
    const owner = new TestHelpers.UserHelper(SERVER_URL, usersInstances[0]);
    const member = new TestHelpers.UserHelper(SERVER_URL, usersInstances[2]);

    const group = await owner.createGroup('test');
    const cluster = await owner.createCluster('test', false);
    await owner.addMember(usersInstances[2]);
    member.setGroup(group);
    try {
      const orgs = await Promise.all(
        organizationsUuids.map(org => member.createOrganization(org, cluster))
      );
    } catch (err) {
      err.should.have.status(401);
    }
  });

  it('A member should not be able to remove organizations from a cluster', async () => {
    const organizationsUuids = ['Org1', 'Org2', 'Org3'];
    const owner = new TestHelpers.UserHelper(SERVER_URL, usersInstances[0]);
    const member = new TestHelpers.UserHelper(SERVER_URL, usersInstances[1]);

    const group = await owner.createGroup('test');
    const cluster = await owner.createCluster('test', false);
    const orgs = await Promise.all(
      organizationsUuids.map(org => owner.createOrganization(org, cluster))
    );
    await owner.addMember(usersInstances[2]);
    member.setGroup(group);
    try {
      await Promise.all(orgs.map(org => member.removeOrganization(org)));
    } catch (err) {
      err.should.have.status(401);
    }
  });
});
