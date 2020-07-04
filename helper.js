const User = require("./models/User"),
  Team = require("./models/Team"),
  Story = require("./models/Story"),
  Sprint = require("./models/Sprint");

const helper = {};

helper.populateSprint = function (req, res, ref) {
  Sprint.find({ team: ref })
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
    .exec((err, transaction) => {
      if (err) {
        res.sendStatus(500);
      } else {
        res.json(transaction);
      }
    });
};

helper.populateTeam = function (req, res, ref) {
  Team.findById(ref)
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
    .populate({
      path: "sprints",
      model: "Sprint",
      populate: {
        path: "stories",
        model: "Story",
        populate: {
          path: "assigned",
          model: "User",
        },
      },
    })
    .populate({
      path: "sprints",
      model: "Sprint",
      populate: {
        path: "stories",
        model: "Story",
        populate: {
          path: "author",
          model: "User",
        },
      },
    })
    .populate({
      path: "sprints",
      model: "Sprint",
      populate: {
        path: "stories",
        model: "Story",
        populate: {
          path: "sprint",
          model: "Sprint",
        },
      },
    })
    .exec((err, transaction) => {
      if (err) {
        res.sendStatus(500);
      } else {
        res.json({ team: transaction });
      }
    });
};

module.exports = helper;
