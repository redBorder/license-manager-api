'use strict';

module.exports = async function(app) {
  const Manager = app.models.Manager;

  const admin = await Manager.findOne({where: {username: 'admin'}});
  if (!admin) {
    Manager.create({
      username: 'admin',
      email: 'licenses@redborder.com',
      password: 'admin',
    });
  }
};
