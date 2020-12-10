const moment = require("moment");
const sanitizeHtml = require("sanitize-html");

const util = require("../util/util");

const router = require("express").Router()

const dateTimeFormat = "DD.MM.YYYY HH:mm";

const sanitizeHtmlSettins = {
    allowedTags: ["img", ...sanitizeHtml.defaults.allowedTags],
    allowedAttributes: Object.assign({
        "*": ["style", "data-"]
    }, sanitizeHtml.defaults.allowedAttributes)
}

router.get("/", (req, res) => {
    req.db.all(`SELECT p.*, u.display_name AS displayname FROM posts AS p LEFT JOIN users AS u ON u.id = p.user_id ORDER BY p.timestamp DESC`, (err, rows) => {
        console.log(rows);
        if (err)
            return res.status(500).render("error", {
                msg: "Error display"
            });

        const a = util.isAuth(req);
        return res.render("index", {
            data: rows.map(x => {
                x.timestamp = moment.unix(x.timestamp).format(dateTimeFormat);
                x.content = sanitizeHtml(x.content, sanitizeHtmlSettins);
                if (a && x.user_id == req.session.userId) {
                    x.edit = "/createPost/" + x.id;
                    x.delete = "/delete/" + x.id;
                }
                return x;
            })
        });
    });
});

router.use(util.auth);

router.get("/secret", (req, res) => {
    return res.render("secret");
});

router.get("/createPost/:id?", (req, res) => {
    const id = req.params.id;
    if (!id) {
        return res.render("createPost", {
            timestamp: moment().format(dateTimeFormat)
        });
    }

    req.db.get("SELECT * FROM posts WHERE id = ? AND user_id = ?", [id, req.session.userId], (err, row) => {
        if (err) {
            return res.status(500).render("error", {
                msg: "Error creating"
            });
        } else if (!row) {
            return res.status(404).render("error", {
                msg: "Not found"
            });
        }

        row.timestamp = moment.unix(row.timestamp).format(dateTimeFormat)
        row.content = sanitizeHtml(row.content, sanitizeHtmlSettins);

        return res.render("createPost", row);
    });
});

router.post("/createPost/:id?", (req, res) => {
    const id = req.body.id;
    const subject = req.body.subject;
    const content = req.body.content;
    const timestamp = moment(req.body.timestamp, dateTimeFormat).unix();

    if (!timestamp)
        return res.status(500).render("error", {
            msg: "Invalid date"
        });

    console.log(id);
    if (!id) {
        req.db.run(`INSERT INTO posts (user_id, subject, content, timestamp) VALUES (?, ?, ?, ?)`,
            [req.session.userId, subject, content, timestamp], (err) => {
                if (err) {
                    return res.status(500).render("error", {
                        msg: "Error creating"
                    });
                }

                return res.redirect("/");
            });
        return;
    }

    req.db.run(`
    UPDATE posts SET
        subject = ?,
        content = ?,
        timestamp = ?
    WHERE id = ? AND user_id = ?
    `, [subject, content, timestamp, id, req.session.userId], (err) => {
        if (err) {
            return res.status(500).render("error", {
                msg: "Error updating"
            });
        }

        return res.redirect("/");
    });

    console.log(id, subject, content, timestamp.toString());
});

router.get("/delete/:id", (req, res) => {
    req.db.run("DELETE FROM posts WHERE id = ? AND user_id = ?", [req.params.id, req.session.userId], (err) => {
        if (err) {
            return res.status(500).render("error", {
                msg: "Error updating"
            });
        }
        return res.redirect("/");
    });
});

module.exports = router;