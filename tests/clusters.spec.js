'use strict';

process.env.NODE_ENV = 'testing';
const SERVER_URL = 'http://localhost:3000/api/v0/';

const app = require('../server/server');
const chai = require('chai');
const _ = require('lodash');

const TestHelpers = require('./test-helpers');
const UsersFixtures = require('./test-fixtures').users;

describe('Clusters', () => {
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
    await server.close();
  });

  it('The owner should be able to list clusters', async () => {
    const ownerHelper = new TestHelpers.UserHelper(
      SERVER_URL,
      usersInstances[0]
    );

    const clusterUIDS = ['Cluster1', 'Cluster2', 'Cluster3'];

    const group = await ownerHelper.createGroup('test');
    await Promise.all(clusterUIDS.map(e => ownerHelper.createCluster(e)));
    const clusters = await ownerHelper.getClusters();

    clusters.should.have.length(3);
    _.zip(clusters, clusterUIDS).forEach(e => e[0].uuid.should.equal(e[1]));
  });

  it('The owner should be able to create clusters', async () => {
    const ownerHelper = new TestHelpers.UserHelper(
      SERVER_URL,
      usersInstances[0]
    );

    const group = await ownerHelper.createGroup('test');
    const cluster = await ownerHelper.createCluster('TEST-UUID');

    cluster.uuid.should.equal('TEST-UUID');
    group.id.should.equal(cluster.groupId);
  });

  it('The owner should be able to remove clusters', async () => {
    const ownerHelper = new TestHelpers.UserHelper(
      SERVER_URL,
      usersInstances[0]
    );

    const group = await ownerHelper.createGroup('test');
    const cluster = await ownerHelper.createCluster('TEST-UUID');
    await ownerHelper.removeCluster('TEST-UUID');

    const clusters = await ownerHelper.getClusters();
    clusters.should.have.length(0);
  });

  it('An admin should be able to list clusters', async () => {
    const ownerHelper = new TestHelpers.UserHelper(
      SERVER_URL,
      usersInstances[0]
    );
    const adminHelper = new TestHelpers.UserHelper(
      SERVER_URL,
      usersInstances[1]
    );

    const clusterUIDS = ['Cluster1', 'Cluster2', 'Cluster3'];

    const group = await ownerHelper.createGroup('test');
    await Promise.all(clusterUIDS.map(e => ownerHelper.createCluster(e)));
    await ownerHelper.addAdmin(usersInstances[1]);
    adminHelper.setGroup(group);
    const clusters = await adminHelper.getClusters();

    clusters.should.have.length(3);
    _.zip(clusters, clusterUIDS).forEach(e => e[0].uuid.should.equal(e[1]));
  });

  it('An admin should be able to create clusters', async () => {
    const ownerHelper = new TestHelpers.UserHelper(
      SERVER_URL,
      usersInstances[0]
    );
    const adminHelper = new TestHelpers.UserHelper(
      SERVER_URL,
      usersInstances[1]
    );

    const group = await ownerHelper.createGroup('test');
    ownerHelper.addAdmin(usersInstances[1]);
    adminHelper.setGroup(group);

    const cluster = await adminHelper.createCluster('TEST-UUID');

    cluster.uuid.should.equal('TEST-UUID');
    group.id.should.equal(cluster.groupId);
  });

  it('An admin should be able to remove clusters', async () => {
    const ownerHelper = new TestHelpers.UserHelper(
      SERVER_URL,
      usersInstances[0]
    );
    const adminHelper = new TestHelpers.UserHelper(
      SERVER_URL,
      usersInstances[1]
    );

    const group = await ownerHelper.createGroup('test');
    const cluster = await ownerHelper.createCluster('TEST-UUID');
    await ownerHelper.addAdmin(usersInstances[1]);
    adminHelper.setGroup(group);
    await adminHelper.removeCluster('TEST-UUID');

    const clusters = await adminHelper.getClusters();

    clusters.should.have.length(0);
  });

  it('A member should be able to list clusters', async () => {
    const ownerHelper = new TestHelpers.UserHelper(
      SERVER_URL,
      usersInstances[0]
    );
    const memberHelper = new TestHelpers.UserHelper(
      SERVER_URL,
      usersInstances[2]
    );

    const clusterUIDS = ['Cluster1', 'Cluster2', 'Cluster3'];

    const group = await ownerHelper.createGroup('test');
    await Promise.all(clusterUIDS.map(e => ownerHelper.createCluster(e)));
    await ownerHelper.addMember(usersInstances[2]);
    memberHelper.setGroup(group);
    const clusters = await memberHelper.getClusters();

    clusters.should.have.length(3);
    _.zip(clusters, clusterUIDS).forEach(e => e[0].uuid.should.equal(e[1]));
  });

  it('A member should not be able to create clusters', async () => {
    const ownerHelper = new TestHelpers.UserHelper(
      SERVER_URL,
      usersInstances[0]
    );
    const memberHelper = new TestHelpers.UserHelper(
      SERVER_URL,
      usersInstances[2]
    );

    const group = await ownerHelper.createGroup('test');
    ownerHelper.addMember(usersInstances[2]);
    memberHelper.setGroup(group);

    try {
      await memberHelper.createCluster('TEST-UUID');
      throw 'Members are able to create clusters!';
    } catch (err) {
      err.should.have.status(401);
    }
  });

  it('A member should not be able to remove clusters', async () => {
    const ownerHelper = new TestHelpers.UserHelper(
      SERVER_URL,
      usersInstances[0]
    );
    const memberHelper = new TestHelpers.UserHelper(
      SERVER_URL,
      usersInstances[2]
    );

    const group = await ownerHelper.createGroup('test');
    const cluster = await ownerHelper.createCluster('TEST-UUID');
    await ownerHelper.addMember(usersInstances[2]);
    memberHelper.setGroup(group);

    try {
      await memberHelper.removeCluster('TEST-UUID');
    } catch (err) {
      err.should.have.status(401);
    }

    const clusters = await memberHelper.getClusters();

    clusters.should.have.length(1);
  });
});
