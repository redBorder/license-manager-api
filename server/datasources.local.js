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
};
