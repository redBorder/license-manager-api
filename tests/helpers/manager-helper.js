'use strict';

const chai = require('chai');
const chaiHttp = require('chai-http');

chai.use(chaiHttp);

/**
 * ManagerHelper is a wraper of a HTTP REST client used for tests.
 *
 * Every instance of a ManagerHelper is associated to a manager so the requests
 * done by an instance will use the associated manager access token.
 */
class ManagerHelper {
  /**
   * Creates a new instance of ManagerHelper associated to a manager.
   *
   * @param  {String} serverUrl  URL of the loopback server
   * @param  {Object} manager    Manager to use on this instance
   */
  constructor(serverUrl, manager) {
    this.req = chai.request(serverUrl);
    this.manager = manager;
  }

  /**
   * Creates a new manager.
   *
   * @param  {String}  serverUrl  URL of the loopback server
   * @param  {Object}  attributes Attributes of the manager to create
   * @return {Promise}            Created manager
   */
  async createManager(attributes) {
    const res = await this.req
      .post('managers')
      .set('Authorization', this.manager.authToken.id)
      .send(attributes);

    return res.body;
  }

  /**
   * List all managers.
   *
   * @return {Promise} Array of all managers on the database
   */
  async getManagers() {
    const res = await this.req
      .get('managers')
      .set('Authorization', this.manager.authToken.id);

    return res.body;
  }

  /**
   * List all license pools on the database
   *
   * @return {Promise} Array of license pools
   */
  async getLicensePools() {
    const res = await this.req
      .get('license-pools')
      .set('Authorization', this.manager.authToken.id);

    return res.body;
  }

  /**
   * Approves an existing license pool.
   *
   * @param  {String}  licensePool License pool ID to approve
   */
  async approve(licensePool) {
    const res = await this.req
      .post(`license-pools/${licensePool}/approve`)
      .set('Authorization', this.manager.authToken.id);
  }

  /**
   * Rejects an existing license pool.
   *
   * @param  {String}  licensePool License pool ID to approve
   */
  async reject(licensePool) {
    const res = await this.req
      .post(`license-pools/${licensePool}/reject`)
      .set('Authorization', this.manager.authToken.id);
  }
}

module.exports = ManagerHelper;
