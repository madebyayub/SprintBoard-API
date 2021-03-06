const express = require("express"),
  router = express.Router(),
  helper = require("../helper"),
  User = require("../models/User");

/* POST route for creating a new user */

router.post("/user", function (req, res) {
  if (req.body && req.body.userID && req.body.profilePic && req.body.name) {
    User.create(
      {
        userID: req.body.userID,
        name: req.body.name,
        profilePic: req.body.profilePic,
        team: [],
        channels: [],
        leader: false,
      },
      function (err, user) {
        if (!err) {
          helper.populateUser(req, res, user._id);
        } else {
          res.sendStatus(500);
        }
      }
    );
  } else {
    res.sendStatus(403);
  }
});

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
      if (user) {
        User.findById(user._id)
          .populate({
            path: "channels",
            model: "Channel",
            populate: { path: "messages", model: "Message" },
          })
          .exec((err, transaction) => {
            if (err) {
              res.sendStatus(500);
            } else {
              res.json({ user: transaction });
            }
          });
      } else {
        res.json({});
      }
    }
  });
});

module.exports = router;
