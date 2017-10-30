'use strict';

const chai = require('chai');
const chaiHttp = require('chai-http');
const GroupHelper = require('./group-helper');

chai.use(chaiHttp);

/**
 * Example users
 */
const testUsers = [
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

/**
 * UserHelper is a wraper of a HTTP REST client used for tests. Also contains
 * a utility function to generate example users.
 *
 * Every instance of a UserHelper is associated to a user so the requests
 * done by an instance uses the associated user access token.
 */
class UserHelper {
  /**
   * Creates a new instance of UserHelper associated to a user.
   *
   * @param  {String} serverUrl URL of the loopback server
   * @param  {Object} user      User to use on this instance
   */
  constructor(serverUrl, user) {
    this.url = serverUrl;
    this.req = chai.request(serverUrl);
    this.user = user;
  }

  /**
   * Returns the internal user instace.
   *
   * @return {Object} Internal user instance
   */
  getInstance() {
    return this.user;
  }

  /**
   * List all the groups where the user is member
   *
   * @return {Promise} Array of groups
   */
  async getGroups() {
    const res = await this.req
      .get('groups')
      .set('Authorization', this.user.authToken.id);

    return res.body;
  }

  /**
   * Creates a new group
   *
   * @param  {String}  [name='test']      Name of the group to create
   * @param  {String}  [type='redborder'] Type of the group to create
   * @return {Promise}                    GroupHelper attached to the created
   *                                      group
   */
  async createGroup(name = 'test', type = 'redborder') {
    const res = await this.req
      .post('groups')
      .set('Authorization', this.user.authToken.id)
      .send({type, name});

    return new GroupHelper(this, res.body);
  }

  /**
   * Attach the user to a group. Returns GroupHelper instance associated to this
   * user.
   *
   * @param  {Object} groupHelper Group to associate this user to
   * @return {Object}             GroupHelper associated to the user
   */
  attachGroup(groupHelper) {
    return new GroupHelper(this, groupHelper.group);
  }

  /**
   * Creates a new manager. Should always return an Unauthorized error since
   * users are not allowed to create managers.
   *
   * @param  {Object}  manager Manager to create
   * @return {Promise}         Created manager
   */
  async createManager(manager) {
    const res = await this.req
      .post('managers')
      .set('Authorization', this.user.authToken.id)
      .send(manager);

    return res.body;
  }

  //----------------
  // Static methods
  //----------------

  /**
   * Given a loopback app object and an array of users, creates valid instances
   * of confirmed users with attached access tokens.
   *
   * @param  {Object}  app               Loopback application
   * @param  {Object}  [users=testUsers] Array of users to create
   * @return {Promise}                   Array of created and confirmed users
   *                                     with access tokens attached
   */
  static async CreateInstances(app, users = testUsers) {
    const User = app.models.User;
    const instances = await User.create(users);

    await Promise.all(
      instances.map(user => User.confirm(user.id, user.verificationToken, ''))
    );

    (await Promise.all(
      instances.map(user => user.accessTokens.create())
    )).forEach((authToken, index) => (instances[index].authToken = authToken));

    return instances;
  }
}

module.exports = UserHelper;
