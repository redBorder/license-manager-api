'use strict';

module.exports = function(app) {
  var Role = app.models.Role;
  var Manager = app.models.Manager;

  Role.registerResolver('groupMember', (role, context, cb) => {
    if (context.modelName !== 'group') {
      return process.nextTick(() => cb(null, false));
    }

    var userId = context.accessToken.userId;
    if (!userId) {
      return process.nextTick(() => cb(null, false));
    }

    context.model.findById(context.modelId, (err, group) => {
      if (err) return cb(err);
      if (!group) return cb(new Error('Group not found'));

      group.members.exists(userId, cb);
    });
  });

  Role.registerResolver('groupAdmin', (role, context, cb) => {
    if (context.modelName !== 'group') {
      return process.nextTick(() => cb(null, false));
    }

    var userId = context.accessToken.userId;
    if (!userId) {
      return process.nextTick(() => cb(null, false));
    }

    context.model.findById(context.modelId, (err, group) => {
      if (err) return cb(err);
      if (!group) return cb(new Error('Group not found'));

      group.admins.exists(userId, cb);
    });
  });

  Role.registerResolver('manager', (role, context, cb) => {
    if (!context.accessToken.userId) {
      return process.nextTick(() => cb(null, false));
    }

    Manager.findById(context.accessToken.userId, (err, manager) => {
      if (err) return cb(err);
      cb(null, !!manager);
    });
  });
};
