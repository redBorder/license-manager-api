'use strict';

function updateLicensePool(status) {
  return async function() {
    this.status = status;
    return this.save();
  };
}

module.exports = function(Licensepool) {
  Licensepool.validatesInclusionOf('status', {
    in: ['pending', 'valid', 'expired', 'rejected'],
  });
  Licensepool.validatesInclusionOf('duration', {
    in: [1, 2, 12, 36],
  });
  Licensepool.validatesInclusionOf('limit', {
    in: [500, 1500, 3000, 10000, 25000, 50000, 100000, 250000, 500000],
  });

  Licensepool.prototype.approve = updateLicensePool('valid');
  Licensepool.prototype.reject = updateLicensePool('rejected');
};
