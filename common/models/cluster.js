'use strict';

module.exports = function(Cluster) {
  Cluster.validatesUniquenessOf('uuid', {message: 'uuid already registered'});
};
