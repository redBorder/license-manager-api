'use strict';

const _ = require('lodash');

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
  const user = app.models.user;

  Group.validatesUniquenessOf('name', {message: 'name is not unique'});

  Group.disableRemoteMethodByName('exists');
  Group.disableRemoteMethodByName('upsert');
  Group.disableRemoteMethodByName('upsertWithWhere');
  Group.disableRemoteMethodByName('replaceOrCreate');
  Group.disableRemoteMethodByName('replaceById');
  Group.disableRemoteMethodByName('updateAll');
  Group.disableRemoteMethodByName('prototype.updateAttributes');

  Group.disableRemoteMethodByName('findOne');

  Group.disableRemoteMethodByName('deleteById');

  Group.disableRemoteMethodByName('createChangeStream');
  Group.disableRemoteMethodByName('count');

  Group.disableRemoteMethodByName('prototype.__create__members');
  Group.disableRemoteMethodByName('prototype.__delete__members');

  Group.beforeRemote('create', async context => {
    if (!context.args.data.name) {
      return;
    }

    const usr = await user.findById(context.req.accessToken.userId);
    if (!usr) {
      throw Error('Invalid access token');
    }

    context.owner = usr;
    context.args.data.name = `${usr.username}/${context.args.data.name}`;
  });

  Group.afterRemote('create', async (context, instance) => {
    await instance.owner(context.owner);
    await instance.members.add(context.owner);
    await instance.admins.add(context.owner);
    await instance.save();
  });

  Group.afterRemote('find', async (context, instances) => {
    const token = context.req.accessToken.userId.toString();

    const allowedGroup = (await Promise.all(
      instances.map(async instance => await instance.members.find({}))
    )).map(group => group.some(member => member.id.toString() === token));

    const filteredInstances = _.flatten(
      _.zip(instances, allowedGroup).filter(pair => !pair.pop())
    );

    _.pullAll(instances, filteredInstances);
  });

  Group.afterRemote('prototype.__link__admins', async (context, instance) => {
    const group = await Group.findById(instance.groupId);
    await group.members.add(instance.adminId);
  });
};
