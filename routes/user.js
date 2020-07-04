const express = require("express"),
  router = express.Router(),
  User = require("../models/User"),
  Team = require("../models/Team"),
  Story = require("../models/Story"),
  Sprint = require("../models/Sprint");

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
      res.json(user);
    }
  });
});

module.exports = router;
