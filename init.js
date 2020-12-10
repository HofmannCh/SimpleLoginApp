const express = require("express");
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const session = require('express-session');
const sessionFileStore = require('session-file-store');
// const pug = require('pug');
const moment = require("moment");
const morgan = require("morgan");

const port = 4455;

const app = express();
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(cookieParser());
app.use(session({
  key: 'SessionId',
  secret: '12345678',
  genid: (req) => crypto.randomBytes(8).toString("hex"),
  resave: false,
  saveUninitialized: false,
  store: new(sessionFileStore(session))({
    path: "./sessions",
    ttl: 604800 // one week in sec
  }),
  unset: "destroy"
}));
app.use((req, res, next) => {
  res.locals.url = req.url;
  res.locals.session = req.session;
  res.locals.req = () => req;
  res.locals.res = () => res;
  next();
});
app.set("viwes", path.join(__dirname, "views"));
app.set('view engine', 'pug');

// All use or methods after these lines are logged
app.use(morgan((tokens, req, res) => [
    moment().format("YY-MM-DD-HH-mm-ss-SSS"),
    tokens["response-time"](req, res),
    req.xhr ? 1 : 0,
    tokens.status(req, res),
    tokens.method(req, res),
    tokens.res(req, res, "content-length") || "-",
    tokens["remote-addr"](req, res),
    req.path,
    JSON.stringify(req.query || []),
    JSON.stringify(req.body || []),
].map(x => String(x).replace("\t", " ").trimRight()).join("\t"), {
    stream: fs.createWriteStream("requests.log", {
        flags: "a",
        encoding: "utf-8",
        mode: 0666
    })
}));

app.use((req, res, next) => {
  if (res.cookies && req.cookies.SessionId && !req.session.username)
    delete res.cookies.SessionId;
  return next();
})

require("./util/db").then(db => {
  app.use((req, res, next) => {
    req.db = db;
    return next();
  });

  app.use(require("./routers/auth"));
  app.use(require("./routers/posts"));

  app.listen(port, () => console.log("Server running on http://localhost:" + port));
})
