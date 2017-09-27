'use strict';

const path = require('path');

function getApp(model) {
  return new Promise((resolve, reject) => {
    model.getApp((err, app) => {
      if (err) return reject(err);
      resolve(app);
    });
  });
}

module.exports = async User => {
  const app = await getApp(User);
  const Group = app.models.Group;

  User.disableRemoteMethodByName('prototype.__findById__groups');
  User.disableRemoteMethodByName('prototype.__get__groups');
  User.disableRemoteMethodByName('prototype.__destroyById__groups');
  User.disableRemoteMethodByName('prototype.__count__groups');
  User.disableRemoteMethodByName('prototype.__updateById__groups');
  User.disableRemoteMethodByName('prototype.__delete__groups');

  User.afterRemote('*.__create__groups', async (context, instance) => {
    await instance.members.add(instance.ownerId);
    await instance.save();
  });

  if (process.env.NODE_ENV !== 'testing') {
    User.afterRemote('create', async (context, user) => {
      const options = {
        type: 'email',
        protocol: process.env.PROTOCOL || 'http',
        port: process.env.DISPLAY_PORT || 3000,
        host: process.env.HOSTNAME || 'localhost',
        to: user.email,
        from: 'noreply@redborder.com',
        user: user,
      };

      user.verify(options, (err, response) => {
        if (err) {
          User.deleteById(user.id);
          throw err;
        }
      });
    });
  }
};
