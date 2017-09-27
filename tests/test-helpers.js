'use strict';

const chai = require('chai');
const chaiHttp = require('chai-http');

chai.use(chaiHttp);

class MockMailer {
  static send(options, context, cb) {
    cb(null, null);
  }
}

class UserHelper {
  constructor(serverUrl, user) {
    this.req = chai.request(serverUrl);
    this.user = user;
  }

  async createUser(user) {
    const res = await this.req
      .request(this.serverUrl)
      .post('users')
      .send(user);

    this.user = res.body;
    return this.user;
  }

  async createGroup(name) {
    const res = await this.req
      .post('groups')
      .set('Authorization', this.user.authToken.id)
      .send({
        name: 'test',
      });

    this.group = res.body;
    return res;
  }

  async getGroups() {
    const res = await this.req
      .get('groups')
      .set('Authorization', this.user.authToken.id);

    return res.body;
  }

  async getMembers() {
    const res = await this.req
      .get(`groups/${this.group.id}/members`)
      .set('Authorization', this.user.authToken.id);

    return res.body;
  }

  async addMember(member) {
    const res = await this.req
      .put(`groups/${this.group.id}/members/rel/${member.id}`)
      .set('Authorization', this.user.authToken.id);

    return res;
  }

  async deleteMember(member) {
    const res = await this.req
      .delete(`groups/${this.group.id}/members/rel/${member.id}`)
      .set('Authorization', this.user.authToken.id);

    return res;
  }
}

module.exports = {
  UserHelper,
  MockMailer,
};
