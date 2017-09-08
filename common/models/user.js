'use strict';

const path = require('path');

module.exports = User => {
  if (process.env.NODE_ENV !== 'testing') {
    User.afterRemote('create', (context, user, next) => {
      const options = {
        type: 'email',
        to: user.email,
        from: 'noreply@redborder.com',
        subject: 'Thanks for registering.',
        template: path.resolve(__dirname, '../../server/views/verify.ejs'),
        redirect: '/verified',
        user: user,
      };

      user.verify(options, (err, response) => {
        if (err) {
          User.deleteById(user.id);
          return next(err);
        }

        context.res.render(
          path.resolve(__dirname, '../../server/views/response.ejs'),
          {
            title: 'Signed up successfully',
            content:
              'Please check your email and click on the verification link ' +
              'before logging in.',
            redirectTo: '/',
            redirectToLinkText: 'Log in',
          }
        );
      });
    });
  }
};
