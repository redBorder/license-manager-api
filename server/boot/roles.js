'use strict';

module.exports = function(app) {
  var Role = app.models.Role;

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

      var Group = app.models.Group;
      Group.count(
        {
          ownerId: group.ownerId,
          memberId: userId,
        },
        (err, count) => {
          if (err) return cb(err);
          return count > 0 ? cb(null, true) : cb(null, false);
        }
      );
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

      var Group = app.models.Group;
      Group.count(
        {
          ownerId: group.ownerId,
          memberId: userId,
        },
        (err, count) => {
          if (err) return cb(err);
          return count > 0 ? cb(null, true) : cb(null, false);
        }
      );
    });
  });
};
