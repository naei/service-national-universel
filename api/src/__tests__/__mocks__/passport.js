const mongoose = require("mongoose");
const passport = jest.createMockFromModule("passport");
const getNewReferentFixture = require("../fixtures/referent");

passport.authenticate = (type) => {
  return (req, res, next) => {
    req.user = getNewReferentFixture();
    req.user._id = mongoose.Types.ObjectId();
    next();
  };
};

module.exports = passport;
