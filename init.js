const express = require("express");
const path = require('path');
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();
const crypto = require('crypto');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const session = require('express-session');
const sessionFileStore = require('session-file-store');
const sha = require('js-sha256');
// const pug = require('pug');
const moment = require("moment");
const morgan = require("morgan");

const port = 4455;
const pepper = "abd4761e-95ce-4d40-9e54-59cf8189439e";

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

let db = undefined;
const dbPromiseReady = new Promise((resolve, reject) => {
  db = new sqlite3.Database("storage.db", (err) => {
    if (err) {
      console.error(err);
      reject(err);
      return process.exit();
    }

    db.run(`CREATE TABLE IF NOT EXISTS users (
      id INT PRIMARY KEY,
      username TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      password_salt TEXT NOT NULL,
      display_name TEXT NOT NULL
    )`, err => {
      if (err) {
        console.error(err);
        reject(err);
      } else {
        console.log("DB connected");
        resolve();
      }
    });
  })
});

app.use((req, res, next) => {
  if (res.cookies && req.cookies.SessionId && !req.session.username)
    delete res.cookies.SessionId;
  return next();
})

const auth = (req, res, next) => {
  if (req.cookies.SessionId && req.session.username)
    return next();
  res.status(401).render("error", {
    msg: "Unauthorized 401"
  });
};

app.get("/", (req, res) => {
  return res.render('index');
});

app.get("/secret", auth, (req, res) => {
  return res.render('secret');
});

app.get("/login", (req, res) => {
  if (req.session.username)
    return res.redirect("/");
  return res.render('login');
});

app.post("/login", (req, res) => {
  const username = req.body.username;
  const password = req.body.password;

  db.get("SELECT * FROM users WHERE username = ?", [username], (err, row) => {
    if (!row)
      return res.status(404).render("error", {
        msg: "Invalid username"
      });

    const hash = sha.sha256(pepper + password + row.password_salt);

    if (hash !== row.password_hash)
      return res.status(404).render("error", {
        msg: "Invalid password"
      });

    req.session.username = row.username;
    req.session.displayName = row.display_name;
    req.session.save(err => {
      if (err)
        return res.status(500).render("error", {
          msg: err
        });

      return res.redirect("/");
    });
  });
});

app.get("/logout", (req, res) => {
  if (req.session.username && req.cookies.SessionId) {
    res.clearCookie('SessionId');
    req.session.destroy();
    return res.redirect('/');
  }
  return res.redirect('/login');
});

app.get("/register", (req, res) => {
  return res.render('register');
});

app.post("/register", (req, res) => {
  const displayName = req.body.displayname;
  const username = req.body.username;
  const password = req.body.password;

  db.get("SELECT * FROM users WHERE username = ?", [username], (err, row) => {
    if (row)
      return res.status(404).render("error", {
        msg: "Username taken"
      });

    const salt = crypto.randomBytes(6).toString("hex");
    const hash = sha.sha256(pepper + password + salt);

    db.run("INSERT INTO users (username, password_hash, password_salt, display_name) VALUES (?, ?, ?, ?)", [username, hash, salt, displayName], err => {
      if (err)
        return res.status(500).render("error", {
          msg: err
        });

      req.session.username = username;
      req.session.displayName = displayName;
      return res.redirect("/");
    });
  });
});

dbPromiseReady.then(() => app.listen(port, () => console.log("Server running on " + port)))
