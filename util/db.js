
const moment = require("moment");
const sqlite3 = require('sqlite3').verbose();

module.exports = new Promise((resolve,reject) => {
    const db = new sqlite3.Database("storage.db", (err) => {
      if (err) {
        console.error(err);
        return reject(err);
      }
  
      db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL,
        password_hash TEXT NOT NULL,
        password_salt TEXT NOT NULL,
        display_name TEXT NOT NULL
      )`, (err, res) => {
        if (err) {
          console.error(err);
          return reject(err);
        }
  
          db.get("SELECT id FROM users LIMIT 1", (err, row) => {
            if(row){
              console.log("Existing DB connected");
              return resolve(db);
            }
          db.serialize(() => {
            db.run(`CREATE TABLE posts (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              user_id INTEGER NOT NULL,
              subject TEXT NOT NULL,
              content TEXT NOT NULL,
              timestamp INT NOT NULL,
              FOREIGN KEY (user_id) REFERENCES users(id)
            )`);
  
            db.run(`INSERT INTO users (username, display_name, password_hash, password_salt) VALUES (?, ?, ?, ?), (?, ?, ?, ?), (?, ?, ?, ?)`,
            ["lb1", "LB User 1","843faa74b89a86d856b4aa5fd3b9ce6608fe5dad0c6e2b49fa97afb83e841440", "18a1a57c97fb",
            "lb2", "LB User 2","843faa74b89a86d856b4aa5fd3b9ce6608fe5dad0c6e2b49fa97afb83e841440", "18a1a57c97fb",
            "lb3", "LB User 3","843faa74b89a86d856b4aa5fd3b9ce6608fe5dad0c6e2b49fa97afb83e841440", "18a1a57c97fb"]);
  
            db.run(`INSERT INTO posts (user_id, subject, content, timestamp) VALUES
             (?, ?, ?, ?), (?, ?, ?, ?), (?, ?, ?, ?), (?, ?, ?, ?), (?, ?, ?, ?)`,
            [1, "Post 1", "Hallo", moment("2020-12-09 08:00:00").unix(),
            2, "Post 2", "Super", moment("2020-12-09 10:00:00").unix(),
            1, "Post 3", ":)", moment("2020-12-09 12:00:00").unix(),
            2, "Post 4", "Lgjdshfkjsd", moment("2020-12-10 04:00:00").unix(),
            3, "Post 5", "<b>AHHHH</b>", moment("2020-12-10 16:00:00").unix()]);
  
            console.log("New DB connected");
            return resolve(db);
          });
        });
      });
    })
  });