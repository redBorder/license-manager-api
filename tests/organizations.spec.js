'use strict';

process.env.NODE_ENV = 'testing';
const SERVER_URL = 'http://localhost:3000/api/v0/';

const app = require('../server/server');
const chai = require('chai');
const _ = require('lodash');

const UserHelper = require('./helpers/user-helper');

describe('Organizations', () => {
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
    await app.models.Organization.destroyAll();
    await server.close();
  });

  it('The owner not should be able to create organizations in a global mode cluster', async () => {
    const owner = new UserHelper(SERVER_URL, users[0]);

    const group = await owner.createGroup('test');
    const cluster = await group.createCluster('test', true);

    try {
      await cluster.createOrganization('test');
    } catch (e) {
      e.should.have.status(500);
    }
  });

  it('The owner should be able to create organizations in a cluster', async () => {
    const organizationsUuids = ['Org1', 'Org2', 'Org3'];
    const owner = new UserHelper(SERVER_URL, users[0]);

    const group = await owner.createGroup('test');
    const cluster = await group.createCluster('test', false);
    await Promise.all(
      organizationsUuids.map(org => cluster.createOrganization(org))
    );

    const orgs = await cluster.getOrganizations();
    const pairs = _.zip(organizationsUuids, orgs);
    const errors = pairs
      .map(([uuid, organization]) => organization === uuid)
      .reduce((prev, curr) => prev && curr);
    orgs.should.have.length(3);
    errors.should.equal(false);
  });

  it('The owner should be able to remove organizations from a cluster', async () => {
    const organizationsUuids = ['Org1', 'Org2', 'Org3'];
    const owner = new UserHelper(SERVER_URL, users[0]);

    const group = await owner.createGroup('test');
    const cluster = await group.createCluster('test', false);
    const orgs = await Promise.all(
      organizationsUuids.map(org => cluster.createOrganization(org))
    );

    await Promise.all(orgs.map(org => cluster.removeOrganization(org)));

    const organizations = await cluster.getOrganizations();
    organizations.should.have.length(0);
  });

  it('An admin should be able to list organizations in a cluster', async () => {
    const organizationsUuids = ['Org1', 'Org2', 'Org3'];
    const owner = new UserHelper(SERVER_URL, users[0]);
    const admin = new UserHelper(SERVER_URL, users[1]);

    const group = await owner.createGroup('test');
    const cluster = await group.createCluster('test', false);
    await Promise.all(
      organizationsUuids.map(org => cluster.createOrganization(org))
    );
    await group.addAdmin(admin);
    const adminCluster = admin.attachGroup(group).attachCluster(cluster);

    const organizations = await adminCluster.getOrganizations();
    organizations.should.have.length(3);
  });

  it('An admin should be able to create organizations in a cluster', async () => {
    const organizationsUuids = ['Org1', 'Org2', 'Org3'];
    const owner = new UserHelper(SERVER_URL, users[0]);
    const admin = new UserHelper(SERVER_URL, users[1]);

    const group = await owner.createGroup('test');
    const cluster = await group.createCluster('test', false);
    await group.addAdmin(admin);
    const adminCluster = admin.attachGroup(group).attachCluster(cluster);

    const orgs = await Promise.all(
      organizationsUuids.map(org => adminCluster.createOrganization(org))
    );

    orgs.should.have.length(3);
    _.zip(organizationsUuids, orgs)
      .map(([uuid, organization]) => organization === uuid)
      .reduce((prev, curr) => prev && curr)
      .should.equal(false);
  });

  it('An admin should be able to remove organizations from a cluster', async () => {
    const organizationsUuids = ['Org1', 'Org2', 'Org3'];
    const owner = new UserHelper(SERVER_URL, users[0]);
    const admin = new UserHelper(SERVER_URL, users[1]);

    const group = await owner.createGroup('test');
    const cluster = await group.createCluster('test', false);
    const orgs = await Promise.all(
      organizationsUuids.map(org => cluster.createOrganization(org))
    );
    await group.addAdmin(admin);
    const adminCluster = admin.attachGroup(group).attachCluster(cluster);

    await Promise.all(orgs.map(org => adminCluster.removeOrganization(org)));

    const organizations = await cluster.getOrganizations();
    organizations.should.have.length(0);
  });

  it('A member should be able to list organizations in a cluster', async () => {
    const organizationsUuids = ['Org1', 'Org2', 'Org3'];
    const owner = new UserHelper(SERVER_URL, users[0]);
    const member = new UserHelper(SERVER_URL, users[2]);

    const group = await owner.createGroup('test');
    const cluster = await group.createCluster('test', false);
    const organizations = await Promise.all(
      organizationsUuids.map(org => cluster.createOrganization(org))
    );
    await group.addMember(member);
    const memberCluster = member.attachGroup(group).attachCluster(cluster);

    const orgs = await memberCluster.getOrganizations();

    organizations.should.have.length(3);
    _.zip(organizationsUuids, orgs)
      .map(([uuid, organization]) => organization === uuid)
      .reduce((prev, curr) => prev && curr)
      .should.equal(false);
  });

  it('A member should not be able to create organizations in a cluster', async () => {
    const organizationsUuids = ['Org1', 'Org2', 'Org3'];
    const owner = new UserHelper(SERVER_URL, users[0]);
    const member = new UserHelper(SERVER_URL, users[2]);

    const group = await owner.createGroup('test');
    const cluster = await group.createCluster('test', false);
    await group.addMember(member);
    const memberCluster = member.attachGroup(group).attachCluster(cluster);

    await Promise.all(
      organizationsUuids
        .map(org => memberCluster.createOrganization(org))
        .map(p => p.catch(err => err.status.should.equal(401)))
    );
  });

  it('A member should not be able to remove organizations from a cluster', async () => {
    const organizationsUuids = ['Org1', 'Org2', 'Org3'];
    const owner = new UserHelper(SERVER_URL, users[0]);
    const member = new UserHelper(SERVER_URL, users[1]);

    const group = await owner.createGroup('test');
    const cluster = await group.createCluster('test', false);
    const orgs = await Promise.all(
      organizationsUuids.map(org => cluster.createOrganization(org))
    );
    await group.addMember(member);
    const memberCluster = member.attachGroup(group).attachCluster(cluster);

    await Promise.all(
      organizationsUuids
        .map(org => memberCluster.removeOrganization(org))
        .map(p => p.catch(err => err.status.should.equal(401)))
    );
  });
});
