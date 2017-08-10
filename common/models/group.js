'use strict';

module.exports = function(Group) {
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
};
