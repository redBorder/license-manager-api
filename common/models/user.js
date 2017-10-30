'use strict';

class StubMailer {
  static send(options, context, cb) {
    cb(null, null);
  }
}

module.exports = function(User) {
  User.afterRemote('create', async (context, user) => {
    let options = null;

    if (process.env.NODE_ENV === 'testing') {
      options = {
        type: 'email',
        from: 'test',
        mailer: StubMailer,
      };
    } else {
      options = {
        type: 'email',
        protocol: process.env.PROTOCOL || 'http',
        port: process.env.DISPLAY_PORT || 3000,
        host: process.env.HOSTNAME || 'localhost',
        to: user.email,
        from: 'noreply@redborder.com',
        user: user,
      };
    }

    user.verify(options, (err, response) => {
      if (err) {
        User.deleteById(user.id);
        throw err;
      }
    });
  });
};
