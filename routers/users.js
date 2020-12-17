const util = require("../util/util");
const crypto = require('crypto');
const sha = require('js-sha256');

const pepper = "abd4761e-95ce-4d40-9e54-59cf8189439e";

const router = require("express").Router()

router.use(util.admin);

router.get("/user", (req, res) => {
    req.db.all("SELECT * FROM users", (err, rows) => {
        for (const r of rows) {
            delete r.password_hash;
            delete r.password_salt;
        }
        return res.render("users", {
            data: rows
        });
    });
});

router.get("/user/edit/:id?", (req, res) => {
    console.log(req.params);
    const id = req.params.id;
    if (!id)
        return res.render("user", {});

    req.db.get("SELECT * FROM users WHERE id = ?", req.params.id, (err, row) => {
        if (err || !row) return res.status(404).render("error", {
            msg: "User width id " + id + "not found"
        });

        delete row.password_hash;
        delete row.password_salt;
        return res.render("user", row);
    });
});


router.post("/user/edit/:id?", (req, res) => {

    req.body.reset_salt = req.body.reset_salt == "on" ? 1 : 0;
    req.body.is_admin = req.body.is_admin == "on" ? 1 : 0;

    if (!req.body.username || !req.body.display_name)
        return res.status(500).render(error);

    const id = req.body.id || req.params.id || 0;

    req.db.get("SELECT * FROM users WHERE id = ?", [id], (userErr, userRow) => {
        req.db.get("SELECT * FROM users WHERE username = ?", [req.body.username], (nameErr, nameRow) => {
            if (userErr || nameErr || (userRow ? nameRow && userRow.id !== nameRow.id : nameRow))
                return res.status(404).render("error", {
                    msg: "Username taken"
                });

            if (!userRow) {
                if (!req.body.password)
                    return res.status(404).render("error", {
                        msg: "Password cann't be undefined"
                    });

                const salt = crypto.randomBytes(6).toString("hex");
                const hash = sha.sha256(pepper + req.body.password + salt);

                req.db.run("INSERT INTO users (username, password_hash, password_salt, display_name, is_admin) VALUES (?, ?, ?, ?, ?)", [req.body.username, hash, salt, req.body.display_name, req.body.is_admin], function (err) {
                    if (err)
                        return res.status(500).render("error", {
                            msg: err
                        });

                    return res.redirect("/user");
                });

                return;
            }

            if (req.body.password) {
                const salt = req.body.reset_salt ? crypto.randomBytes(6).toString("hex") : userRow.password_salt;
                const hash = sha.sha256(pepper + req.body.password + salt);

                req.db.run(`UPDATE users SET
                            username = ?,
                            password_hash = ?,
                            password_salt = ?,
                            display_name = ?,
                            is_admin = ?
                        WHERE id = ?`,
                    [req.body.username, hash, salt, req.body.display_name, req.body.is_admin, userRow.id], (err) => {
                        if (err) {
                            return res.status(500).render("error", {
                                msg: "Error updating"
                            });
                        }

                        return res.redirect("/user");
                    });
                return;
            }

            req.db.run(`UPDATE users SET
                        username = ?,
                        display_name = ?,
                        is_admin = ?
                    WHERE id = ?`,
                [req.body.username, req.body.display_name, req.body.is_admin, userRow.id], (err) => {
                    if (err) {
                        return res.status(500).render("error", {
                            msg: "Error updating"
                        });
                    }

                    return res.redirect("/user");
                });
            return;
        });
    });
});

router.get("/user/delete/:id", (req, res) => {
    req.db.run("DELETE FROM users WHERE id = ?", [req.params.id], (err) => {
        if (err) {
            return res.status(500).render("error", {
                msg: "Error updating"
            });
        }
        return res.redirect("/user");
    });
});

module.exports = router;