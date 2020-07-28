const User = require("./models/User"),
  Team = require("./models/Team"),
  Story = require("./models/Story"),
  Sprint = require("./models/Sprint"),
  Channel = require("./models/Channel");

const helper = {};

helper.populateSprint = function (req, res, ref) {
  res.header("Access-Control-Allow-Origin", "*");

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

helper.populateUser = function (req, res, ref) {
  res.json("test");
  User.findById(ref)
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
};

helper.populateTeam = function (req, res, ref) {
  res.header("Access-Control-Allow-Origin", "*");

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
    .populate("channel")
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
