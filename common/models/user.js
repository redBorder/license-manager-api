'use strict';

module.exports = function(User) {
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
