'use strict';

process.env.NODE_ENV = 'testing';
const SERVER_URL = 'http://localhost:3000/api/v0/';

const app = require('../server/server');
const chai = require('chai');
const _ = require('lodash');

const UserHelper = require('./helpers/user-helper');
const GroupHelper = require('./helpers/group-helper');

describe('License pools', () => {
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
    await app.models.LicensePool.destroyAll();
    await server.close();
  });

  it('A non-member should not be able to request a license pool', async () => {
    const owner = new UserHelper(SERVER_URL, users[0]);
    const nonMember = new UserHelper(SERVER_URL, users[2]);

    const group = await owner.createGroup('test');
    const cluster = await group.createCluster('test', true);

    const helper = nonMember.attachGroup(group).attachCluster(cluster);

    try {
      await helper.requestLicensePool({
        duration: 1,
        expiration: '2018-5-29T09:00:00.000Z',
        limit: 500,
        sensors: {ips: 5, flow: 10, social: 0},
        description: 'My description',
        groupId: group.id,
        clusterId: cluster.id,
      });
    } catch (e) {
      e.status.should.equal(401);
    }
  });

  it('A member should be able to request a license pool', async () => {
    const owner = new UserHelper(SERVER_URL, users[0]);
    const member = new UserHelper(SERVER_URL, users[2]);

    const group = await owner.createGroup('test');
    await group.addMember(member);
    const cluster = await group.createCluster('test', true);
    const memberCluster = member.attachGroup(group).attachCluster(cluster);

    const validDurations = [1, 2, 12, 36];
    const validLimits = [
      500,
      1500,
      3000,
      10000,
      25000,
      50000,
      100000,
      250000,
      500000,
    ];
    const pools = _.flattenDeep(
      validDurations.map(duration =>
        validLimits.map(limit => ({
          duration: duration,
          expiration: '2018-05-29T09:00:00.000Z',
          limit: limit,
          sensors: {ips: 5, flow: 10, social: 0},
          description: 'My description',
          groupId: group.getInstance().id,
          clusterId: cluster.getInstance().id,
        }))
      )
    );

    const createdPools = await Promise.all(
      pools.map(pool => memberCluster.requestLicensePool(pool))
    );

    const assertions = _.zip(pools, createdPools)
      .map(
        ([expected, actual]) =>
          expected.duration === actual.duration &&
          expected.expiration === actual.expiration &&
          expected.limit === actual.limit &&
          expected.groupId === actual.groupId &&
          expected.clusterId === actual.clusterId &&
          actual.status === 'pending' &&
          _.isEqual(expected.sensors, actual.sensors)
      )
      .reduce((previous, next) => previous && next);

    assertions.should.equal(true);
  });

  it('A member should not be able to request a invalid license pool', async () => {
    const owner = new UserHelper(SERVER_URL, users[0]);
    const member = new UserHelper(SERVER_URL, users[2]);

    const group = await owner.createGroup('test');
    const cluster = await group.createCluster('test', true);
    await group.addMember(member);

    const helper = member.attachGroup(group).attachCluster(cluster);

    const invalidDurations = [3, 5, 120, 99];
    const invalidLimits = [123, 4444, 30040, 99999];
    const pools = _.flattenDeep(
      invalidDurations.map(duration =>
        invalidLimits.map(limit => ({
          duration: duration,
          expiration: '2018-05-29T09:00:00.000Z',
          limit: limit,
          sensors: {ips: 5, flow: 10, social: 0},
          description: 'My description',
          groupId: group.getInstance().id,
          clusterId: cluster.getInstance().id,
        }))
      )
    );

    await Promise.all(
      pools
        .map(pool => helper.requestLicensePool(pool))
        .map(p => p.catch(err => err.status.should.equal(422)))
    );
  });
});
