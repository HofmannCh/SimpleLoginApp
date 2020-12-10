const crypto = require('crypto');
const sha = require('js-sha256');

const router = require('express').Router()

const pepper = "abd4761e-95ce-4d40-9e54-59cf8189439e";

router.get("/login", (req, res) => {
    if (req.session.username)
        return res.redirect("/");
    return res.render('login');
});

router.post("/login", (req, res) => {
    const username = req.body.username;
    const password = req.body.password;

    req.db.get("SELECT * FROM users WHERE username = ?", [username], (err, row) => {
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
        req.session.userId = row.id;
        req.session.displayName = row.display_name;
        req.session.isAdmin = !!row.is_admin;
        
        req.session.save(err => {
            if (err)
                return res.status(500).render("error", {
                    msg: err
                });

            return res.redirect("/");
        });
    });
});

router.get("/logout", (req, res) => {
    if (req.session.username && req.cookies.SessionId) {
        res.clearCookie('SessionId');
        req.session.destroy();
        return res.redirect('/');
    }
    
    return res.redirect('/login');
});

router.get("/register", (req, res) => {
    return res.render('register');
});

router.post("/register", (req, res) => {
    const displayName = req.body.displayname;
    const username = req.body.username;
    const password = req.body.password;

    req.db.get("SELECT * FROM users WHERE username = ?", [username], (err, row) => {
        if (row)
            return res.status(404).render("error", {
                msg: "Username taken"
            });

        const salt = crypto.randomBytes(6).toString("hex");
        const hash = sha.sha256(pepper + password + salt);

        req.db.run("INSERT INTO users (username, password_hash, password_salt, display_name, is_admin) VALUES (?, ?, ?, ?, ?)", [username, hash, salt, displayName, 0], function (err) {
            if (err)
                return res.status(500).render("error", {
                    msg: err
                });

            req.session.username = username;
            req.session.displayName = displayName;
            req.session.isAdmin = false;
            req.session.userId = this.lastID;

            return res.redirect("/");
        });
    });
});

module.exports = router