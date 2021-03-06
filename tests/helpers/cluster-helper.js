'use strict';

const chai = require('chai');
const chaiHttp = require('chai-http');

chai.use(chaiHttp);

/**
 * ClusterHelper is a wraper of a HTTP REST client used for tests.
 *
 * Every instance of a ClusterHelper is associated to a user so the requests
 * done by an instance will use the associated user access token.
 */
class ClusterHelper {
  /**
   * Creates a new instance of ClusterHelper associated to a group and a user.
   *
   * @param  {Object} groupHelper Group to use on this instance
   * @param  {Object} cluster     Cluster to use on this instance
   */
  constructor(groupHelper, cluster) {
    this.user = groupHelper.user;
    this.group = groupHelper.group;
    this.cluster = cluster;
    this.req = chai.request(groupHelper.url);
  }

  /**
   * Returns the internal cluster instance.
   *
   * @return {Object} Internal cluster instance
   */
  getInstance() {
    return this.cluster;
  }

  /**
   * Creates a new organization inside the cluster.
   *
   * @param  {String}  uuid UUID of the organization to create
   * @return {Promise}      Created organization
   */
  async createOrganization(uuid) {
    const res = await this.req
      .post(`groups/${this.group.id}/organizations`)
      .set('Authorization', this.user.authToken.id)
      .send({uuid, clusterId: this.cluster.id});

    return res.body;
  }

  /**
   * List organizations associated to the cluster.
   *
   * @return {Promise}      Array of organizations
   */
  async getOrganizations() {
    const res = await this.req
      .get(`groups/${this.group.id}/organizations`)
      .set('Authorization', this.user.authToken.id);

    return res.body;
  }

  /**
   * Remove an organization associated to the cluster
   *
   * @param  {Object}  org Organization to remove
   */
  async removeOrganization(org) {
    await this.req
      .delete(`groups/${this.group.id}/organizations/${org.id}`)
      .set('Authorization', this.user.authToken.id);
  }

  /**
   * List license pools in the cluster.
   *
   * @return {Promise}     Array with licenses associated to this cluster
   */
  async getLicensePools() {
    const res = await this.req
      .get(`groups/${this.group.id}/license-pools`)
      .set('Authorization', this.user.authToken.id);

    return res.body.filter(
      licensePool => licensePool.clusterId === this.cluster.id
    );
  }

  /**
   * Request a license pool for the cluster.
   *
   * @param  {Object}  attributes Attributes of the license pool
   * @return {Promise}            Created license pool info
   */
  async requestLicensePool(attributes) {
    const res = await this.req
      .post(`groups/${this.group.id}/license-pools`)
      .set('Authorization', this.user.authToken.id)
      .send(attributes);

    return res.body;
  }
}

module.exports = ClusterHelper;
