const authorise = (role_array) => {
  return (req, res, next) => {
    const userrole = res.body.userrole;
    if (role_array.inclueds(userrole)) {
      next();
    } else {
      res.send("not authorised");
    }
  };
};

module.exports = {
  authorise,
};
