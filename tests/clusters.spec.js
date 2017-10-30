'use strict';

process.env.NODE_ENV = 'testing';
const SERVER_URL = 'http://localhost:3000/api/v0/';

const app = require('../server/server');
const chai = require('chai');
const _ = require('lodash');

const UserHelper = require('./helpers/user-helper');

describe('Clusters', () => {
  let server = null;
  let users = null;

  beforeEach(async () => {
    server = await app.listen();
    users = await UserHelper.CreateInstances(app);
  });

  afterEach(async () => {
    await app.models.User.destroyAll();
    await app.models.Group.destroyAll();
    await app.models.Cluster.destroyAll();
    await server.close();
  });

  it('The owner should be able to list clusters', async () => {
    const clusterUIDS = ['Cluster1', 'Cluster2', 'Cluster3'];

    const owner = new UserHelper(SERVER_URL, users[0]);
    const group = await owner.createGroup('test');

    await Promise.all(clusterUIDS.map(e => group.createCluster(e)));
    const clusters = await group.getClusters();

    clusters.should.have.length(3);
    _.zip(clusters, clusterUIDS).forEach(e => e[0].uuid.should.equal(e[1]));
  });

  it('The owner should be able to create clusters', async () => {
    const owner = new UserHelper(SERVER_URL, users[0]);
    const group = await owner.createGroup('test');
    const cluster = await group.createCluster('TEST-UUID');

    group.getInstance().id.should.equal(cluster.getInstance().groupId);
    cluster.getInstance().uuid.should.equal('TEST-UUID');
  });

  it('The owner should be able to remove clusters', async () => {
    const owner = new UserHelper(SERVER_URL, users[0]);
    const group = await owner.createGroup('test');
    const cluster = await group.createCluster('TEST-UUID');

    await group.removeCluster(cluster);

    const clusters = await group.getClusters();
    clusters.should.have.length(0);
  });

  it('An admin should be able to list clusters', async () => {
    const clusterUIDS = ['Cluster1', 'Cluster2', 'Cluster3'];

    const owner = new UserHelper(SERVER_URL, users[0]);
    const admin = new UserHelper(SERVER_URL, users[1]);

    const group = await owner.createGroup('test');
    await Promise.all(clusterUIDS.map(e => group.createCluster(e)));
    await group.addAdmin(admin);

    const admins = await group.getAdmins();
    const adminGroup = admin.attachGroup(group);
    const clusters = await adminGroup.getClusters();

    clusters.should.have.length(3);
    _.zip(clusters, clusterUIDS).forEach(([actual, expected]) =>
      actual.uuid.should.equal(expected)
    );
  });

  it('An admin should be able to create clusters', async () => {
    const owner = new UserHelper(SERVER_URL, users[0]);
    const admin = new UserHelper(SERVER_URL, users[1]);

    const group = await owner.createGroup('test');
    const adminGroup = admin.attachGroup(group);
    group.addAdmin(admin);

    await adminGroup.createCluster('TEST-UUID');
    const [cluster] = await adminGroup.getClusters();

    cluster.uuid.should.equal('TEST-UUID');
    cluster.groupId.should.equal(group.getInstance().id);
  });

  it('An admin should be able to remove clusters', async () => {
    const owner = new UserHelper(SERVER_URL, users[0]);
    const admin = new UserHelper(SERVER_URL, users[1]);

    const group = await owner.createGroup('test');
    const cluster = await group.createCluster('TEST-UUID');
    await group.addAdmin(admin);
    const adminGroup = admin.attachGroup(group);

    await adminGroup.removeCluster(cluster);
    const clusters = await adminGroup.getClusters();

    clusters.should.have.length(0);
  });

  it('A member should be able to list clusters', async () => {
    const clusterUIDS = ['Cluster1', 'Cluster2', 'Cluster3'];

    const owner = new UserHelper(SERVER_URL, users[0]);
    const member = new UserHelper(SERVER_URL, users[2]);

    const group = await owner.createGroup('test');
    await Promise.all(clusterUIDS.map(e => group.createCluster(e)));
    await group.addMember(member);
    const memberGroup = member.attachGroup(group);

    const clusters = await memberGroup.getClusters();

    clusters.should.have.length(3);
    _.zip(clusters, clusterUIDS).forEach(([actual, expected]) =>
      actual.uuid.should.equal(expected)
    );
  });

  it('A member should not be able to create clusters', async () => {
    const owner = new UserHelper(SERVER_URL, users[0]);
    const member = new UserHelper(SERVER_URL, users[2]);

    const group = await owner.createGroup('test');
    await group.addMember(member);
    const memberGroup = member.attachGroup(group);

    try {
      await memberGroup.createCluster('TEST-UUID');
      throw 'Members are able to create clusters!';
    } catch (e) {
      e.should.have.status(401);
    }
  });

  it('A member should not be able to remove clusters', async () => {
    const owner = new UserHelper(SERVER_URL, users[0]);
    const member = new UserHelper(SERVER_URL, users[2]);

    const group = await owner.createGroup('test');
    const cluster = await group.createCluster('TEST-UUID');
    await group.addMember(member);
    const memberGroup = member.attachGroup(group);

    try {
      await memberGroup.removeCluster(cluster);
    } catch (e) {
      e.should.have.status(401);
    } finally {
      const clusters = await group.getClusters();
      clusters.should.have.length(1);
    }
  });
});
