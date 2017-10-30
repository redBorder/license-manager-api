'use strict';

module.exports = function(Manager) {
  Manager.disableRemoteMethodByName('findById');
  Manager.disableRemoteMethodByName('exists');
  Manager.disableRemoteMethodByName('confirm');
  Manager.disableRemoteMethodByName('upsert');
  Manager.disableRemoteMethodByName('upsertWithWhere');
  Manager.disableRemoteMethodByName('replaceOrCreate');
  Manager.disableRemoteMethodByName('replaceById');
  Manager.disableRemoteMethodByName('updateAll');
  Manager.disableRemoteMethodByName('prototype.updateAttributes');
  Manager.disableRemoteMethodByName('prototype.verify');

  Manager.disableRemoteMethodByName('findOne');

  Manager.disableRemoteMethodByName('deleteById');

  Manager.disableRemoteMethodByName('createChangeStream');
  Manager.disableRemoteMethodByName('count');
};
