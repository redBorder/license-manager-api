'use strict';

process.env.NODE_ENV = 'testing';
const SERVER_URL = 'http://localhost:3000/api/v0/';

const app = require('../server/server');
const chai = require('chai');
const _ = require('lodash');

const UserHelper = require('./helpers/user-helper');
const ManagerHelper = require('./helpers/manager-helper');

describe('Managers', () => {
  let server = null;
  let users = null;
  let managerInstance = null;

  beforeEach(async () => {
    server = await app.listen();

    users = await UserHelper.CreateInstances(app);
    managerInstance = await app.models.Manager.findOne({
      where: {username: 'admin'},
    });
    managerInstance.authToken = await managerInstance.accessTokens.create();
  });

  afterEach(async () => {
    await app.models.User.destroyAll();
    await app.models.Manager.destroyAll();
    await app.models.Group.destroyAll();
    await app.models.Cluster.destroyAll();
    await app.models.LicensePool.destroyAll();
    await app.models.Manager.create({
      username: 'admin',
      password: 'admin',
      email: 'admin@tests.com',
    });
    await server.close();
  });

  it('Manager should be able to list managers', async () => {
    const manager = new ManagerHelper(SERVER_URL, managerInstance);
    const newManager = await manager.createManager({
      username: 'test_manager',
      password: 'password',
      email: 'test@tests.com',
    });

    const managers = await manager.getManagers();

    managers.length.should.equal(2);
  });

  it('Manager should be able to create managers', async () => {
    const manager = new ManagerHelper(SERVER_URL, managerInstance);
    const newManager = await manager.createManager({
      username: 'test_manager',
      password: 'password',
      email: 'test@tests.com',
    });

    newManager.username.should.equal('test_manager');
    newManager.email.should.equal('test@tests.com');
  });

  it('Non managers should not be able to create managers', async () => {
    const user = new UserHelper(SERVER_URL, users[0]);

    try {
      await user.createManager(SERVER_URL, {
        username: 'test_manager',
        password: 'password',
        email: 'test@tests.com',
      });
    } catch (e) {
      e.status.should.equal(401);
    }
  });

  it('Manager should be able to list license pools', async () => {
    const user = new UserHelper(SERVER_URL, users[0]);
    const manager = new ManagerHelper(SERVER_URL, managerInstance);

    const group = await user.createGroup('my-group');
    const cluster = await group.createCluster('my-cluster');
    await cluster.requestLicensePool({
      duration: 1,
      expiration: '2018-05-29T09:00:00.000Z',
      limit: 500,
      sensors: {ips: 5, flow: 10, social: 0},
      description: 'My description',
      groupId: group.getInstance().id,
      clusterId: cluster.getInstance().id,
    });

    const licensePools = await manager.getLicensePools();
    licensePools.should.have.length(1);
  });

  it('Manager should be able to approve license pools', async () => {
    const owner = new UserHelper(SERVER_URL, users[0]);
    const manager = new ManagerHelper(SERVER_URL, managerInstance);

    const group = await owner.createGroup('my-group');
    const cluster = await group.createCluster('my-cluster');
    const req = await cluster.requestLicensePool({
      duration: 1,
      expiration: '2018-05-29T09:00:00.000Z',
      limit: 500,
      sensors: {ips: 5, flow: 10, social: 0},
      description: 'My description',
      groupId: group.getInstance().id,
      clusterId: cluster.getInstance().id,
    });

    await manager.approve(req.id);
    const [licensePool] = await manager.getLicensePools();

    licensePool.status.should.equal('valid');
  });

  it('Manager should be able to reject license pools', async () => {
    const owner = new UserHelper(SERVER_URL, users[0]);
    const manager = new ManagerHelper(SERVER_URL, managerInstance);

    const group = await owner.createGroup('my-group');
    const cluster = await group.createCluster('my-cluster');
    const req = await cluster.requestLicensePool({
      duration: 1,
      expiration: '2018-05-29T09:00:00.000Z',
      limit: 500,
      sensors: {ips: 5, flow: 10, social: 0},
      description: 'My description',
      groupId: group.getInstance().id,
      clusterId: cluster.getInstance().id,
    });

    await manager.reject(req.id);
    const [licensePool] = await manager.getLicensePools();

    licensePool.status.should.equal('rejected');
  });

  it('Users should NOT be able to approve license pools', async () => {
    const owner = new UserHelper(SERVER_URL, users[0]);

    const group = await owner.createGroup('my-group');
    const cluster = await group.createCluster('my-cluster');
    const req = await cluster.requestLicensePool({
      duration: 1,
      expiration: '2018-05-29T09:00:00.000Z',
      limit: 500,
      sensors: {ips: 5, flow: 10, social: 0},
      description: 'My description',
      groupId: group.getInstance().id,
      clusterId: cluster.getInstance().id,
    });

    let status = null;

    try {
      await owner.approve(req.id);
    } catch (e) {
      status = e.status;
    }

    status.should.equal(401);
  });
});
