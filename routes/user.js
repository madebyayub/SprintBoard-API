const express = require("express"),
  router = express.Router(),
  User = require("../models/User"),
  Team = require("../models/Team"),
  Story = require("../models/Story"),
  Sprint = require("../models/Sprint");

// GET ROUTE TO GET TEAM INFORMATION OF A USER
app.get("/team/user/:id", function (req, res) {
  User.findOne({ userID: req.params.id }, function (err, user) {
    if (err) {
      res.sendStatus(500);
    } else {
      if (user) {
        Team.findById(user.team)
          .populate({
            path: "stories",
            model: "Story",
            populate: { path: "author", model: "User" },
          })
          .populate({
            path: "stories",
            model: "Story",
            populate: { path: "sprint", model: "Sprint" },
          })
          .populate({
            path: "stories",
            model: "Story",
            populate: { path: "assigned", model: "User" },
          })
          .populate("members")
          .populate("sprints")
          .exec((err, transaction) => {
            if (err) {
              res.sendStatus(500);
            } else {
              res.json({ team: transaction });
            }
          });
      } else {
        res.json({ team: null });
      }
    }
  });
});
