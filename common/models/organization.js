'use strict';

function getApp(model) {
  return new Promise((resolve, reject) => {
    model.getApp((err, app) => {
      if (err) return reject(err);
      resolve(app);
    });
  });
}

module.exports = async function(Organization) {
  const app = await getApp(Organization);
  const Cluster = app.models.cluster;

  Organization.validatesPresenceOf('clusterId', {message: 'Cannot be blank'});
  Organization.validatesUniquenessOf('uuid', {
    message: 'uuid already registered',
  });
};
