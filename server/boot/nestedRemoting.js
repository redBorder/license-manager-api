'use strict';

module.exports = function initNestRouting(app) {
  app.models.Group.nestRemoting('license-pools');
};
