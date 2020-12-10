const isAuth = req => req.cookies.SessionId && req.session.username && req.session.userId;

const auth = (req, res, next) => {
  if (isAuth(req))
    return next();
  res.status(401).render("error", {
    msg: "Unauthorized 401"
  });
};

module.exports = {
    isAuth,
    auth
};