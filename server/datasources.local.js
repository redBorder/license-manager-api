'use strict';

module.exports = {
  db: {
    connector: 'mongodb',
    hostname: process.env.DB_HOST,
    port: process.env.DB_PORT || 27017,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    url: process.env.MONGODB_URI,
  },
  email: {
    name: 'email',
    connector: 'mail',
    transports: [
      {
        type: 'smtp',
        host: process.env.MAIL_SMTP_SERVER,
        secure: false,
        port: process.env.MAIL_SMTP_PORT,
        tls: {
          rejectUnauthorized: false,
        },
        auth: {
          user: process.env.MAIL_AUTH_USER,
          pass: process.env.MAIL_AUTH_PASSWD,
        },
      },
    ],
  },
};
