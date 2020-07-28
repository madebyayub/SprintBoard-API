const express = require("express"),
  router = express.Router(),
  helper = require("../helper"),
  User = require("../models/User");

/* Get route for fetching the team of a user. */

router.get("/user/team/:id", function (req, res) {
  User.findOne({ userID: req.params.id }, function (err, user) {
    if (err) {
      res.sendStatus(500);
    } else {
      if (user) {
        helper.populateTeam(req, res, user.team);
      } else {
        res.json({ team: null });
      }
    }
  });
});

/* Patch route to update user information upon their login, this
   ensures our application is consistent with the user's google information */

router.patch("/user", function (req, res) {
  User.findOne({ userID: req.body.userID }, function (err, user) {
    if (err) {
      res.sendStatus(500);
    } else {
      user.profilePic = req.body.userpicture;
      user.name = req.body.username;
      user.save();
      helper.populateUser(req, res, user._id);
    }
  });
});

/* Get route to fetch user information upon their login */

router.get("/user/:id", function (req, res) {
  User.findOne({ userID: req.params.id }, function (err, user) {
    if (err) {
      res.sendStatus(500);
    } else {
      res.json("test");
      //helper.populateUser(req, res, user._id);
    }
  });
});

module.exports = router;
