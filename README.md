[![Build Status](https://travis-ci.org/redBorder/license-manager-api.svg?branch=master)](https://travis-ci.org/redBorder/license-manager-api)

# License Manager API

## Overview

HTTP API for redBorder's Licensing Platform.

## Running the API

### Standalone

To run the application you need a MongoDB instance. If there is an instance
running on `localhost`, then just clone the repo, `cd` to the folder and run:

```bash
npm install
npm start
```

If you want to specify a custon databse configuration you can set the following
environment variables:

| Attribute          | Default     |
|--------------------|-------------|
|`DB_HOST`           | localhost   |
|`DB_PORT`           | 27017       |
|`DB_USER`           | root        |
|`DB_PASSWORD`       |             |
|`DB_NAME`           | test        |
|`MAIL_SMTP_SERVER`  |             |
|`MAIL_SMTP_PORT`    |             |
|`MAIL_AUTH_USER`    |             |
|`MAIL_AUTH_PASSWD`  |             |

You can set `NODE_ENV='testing'` to use an in-memory no-persistent database if
you just want to make a quick check.


### Habitat

`// TODO`

### Docker

`// TODO`
