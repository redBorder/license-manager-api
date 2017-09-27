'use strict';

class Users {
  constructor() {
    this.users = [
      {
        email: 'test1@test.com',
        username: 'test1',
        firstName: 'John',
        lastName: 'Doe',
        password: '12345678',
      },
      {
        email: 'test2@test.com',
        username: 'test2',
        firstName: 'Jack',
        lastName: 'Bauer',
        password: '87654321',
      },
      {
        email: 'test3@test.com',
        username: 'test3',
        firstName: 'Whoopi',
        lastName: 'Goldberg',
        password: '777777777',
      },
    ];
  }

  getUsers() {
    return this.users;
  }
}

module.exports = Users;
