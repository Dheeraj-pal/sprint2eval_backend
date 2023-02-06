var jwt = require("jsonwebtoken");
const fs = require("fs");

const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    res.send("login again --- enter token");
  }
  const blacklisteddata = JSON.parse(
    fs.readFileSync("./blacklist.json", "utf-8")
  );

  if (blacklisteddata.includes(token)) {
    return res.send("login again ---- token already present in blacklist");
  }

  jwt.verify(token, "NORMAL_SECRET", function (err, decoded) {
    if (err) {
      res.send({ msg: "*****please login first*****", err: err.message });
    } else {
      const userrole = decoded?.role;
      req.body.userrole = userrole;
      next();
    }
  });
};

module.exports = {
  authenticate,
};
