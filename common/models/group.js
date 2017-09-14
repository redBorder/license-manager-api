'use strict';

function getApp(model) {
  return new Promise((resolve, reject) => {
    model.getApp((err, app) => {
      if (err) return reject(err);
      resolve(app);
    });
  });
}

module.exports = async function(Group) {
  const app = await getApp(Group);
  const User = app.models.User;

  Group.disableRemoteMethodByName('create');
  Group.disableRemoteMethodByName('exists');
  Group.disableRemoteMethodByName('upsert');
  Group.disableRemoteMethodByName('upsertWithWhere');
  Group.disableRemoteMethodByName('replaceOrCreate');
  Group.disableRemoteMethodByName('replaceById');
  Group.disableRemoteMethodByName('updateAll');
  Group.disableRemoteMethodByName('prototype.updateAttributes');

  Group.disableRemoteMethodByName('find');
  Group.disableRemoteMethodByName('findById');
  Group.disableRemoteMethodByName('findOne');

  Group.disableRemoteMethodByName('deleteById');

  Group.disableRemoteMethodByName('createChangeStream');
  Group.disableRemoteMethodByName('count');

  Group.disableRemoteMethodByName('prototype.__create__members');
  Group.disableRemoteMethodByName('prototype.__delete__members');

  /**
  * Adds a member to the group. Checks the following:
  *  - Is this user already on the group?
  *  - Does this user exists?
  **/
  Group.prototype.addMember = async function(data) {
    if (!data.email) {
      throw Error('No email provided');
    }

    const user = await User.findOne({where: {email: data.email}});
    if (!user) {
      throw Error('User does not exists');
    }

    const exists = await this.members.exists(user.id);
    if (exists) {
      throw Error('This user is already a member of the group');
    }

    await this.members.add(user.id);
    await this.save();
  };

  /**
  * Removes a member to the group. Checks the following:
  *  - Is this user already on the group?
  *  - Does this user exists?
  *  - Is the user the owner of the group
  **/
  Group.prototype.removeMember = async function(data) {
    if (!data.email) {
      throw Error('No email provided');
    }

    const user = await User.findOne({where: {email: data.email}});
    if (!user) {
      throw Error('User does not exists');
    }

    if (this.ownerId.toString() === user.id.toString()) {
      throw Error('You cant remove the owner');
    }

    const exists = await this.members.exists(user.id);
    if (!exists) {
      throw Error('This user is not a member of the group');
    }

    await this.members.remove(user.id);
    await this.save();
  };
};
