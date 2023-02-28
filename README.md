# SimpleLoginApp
[![Example](https://media.hofi.dev/data/1711fce8f5.png)](https://github.com/HofmannCh/SimpleLoginApp)

It is a simple app which contains a post read which is public and a post create function which is only accessible after login or registration. In addition, if you set (over db or as already admin) the admin flag by a user he can edit all posts and users.

# Uses technologies
* Html rendering: Pug https://pugjs.org/
* Webserver: Express http://expressjs.com/
* Database: Sqlite3 https://github.com/mapbox/node-sqlite3
* Password encryption: Sha256 https://github.com/emn178/js-sha256

# App featuring
* Posts
  * Overview
  * Creation
  * Editing
* Authentication and Authorization
  * Login
  * Registration
  * Admin role
* Security
  * Sha256 Password encryption
  * Password salt and pepper
  * XSS Protection (Pug and html sanitizer)
* Webserver
  * Session
  * Cookies
  * Logs requests
  * Database Sqlite3

# Logins
The following default users are seeded in the DB:
|User|Password|
|----|--------|
|lb1 |sml12345|
|lb2 |sml12345|
|lb3 |sml12345|


# Start
> git clone https://github.com/HofmannCh/SimpleLoginApp.git

> cd SimpleLoginApp

> npm i

> npm run start

The following default users are created:

