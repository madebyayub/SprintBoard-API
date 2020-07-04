const express = require("express"),
  router = express.Router(),
  User = require("../models/User"),
  Team = require("../models/Team"),
  Story = require("../models/Story"),
  Sprint = require("../models/Sprint");

router.post("/sprint", function (req, res) {
  Team.findById(req.body.team._id, function (err, team) {
    if (err) {
      res.sendStatus(500);
    } else {
      if (!team) {
        res.send("team not found");
      } else {
        Sprint.findOne(
          { team: team._id, number: req.body.sprint.number },
          function (err, sprint) {
            if (!sprint) {
              if (err) {
                res.sendStatus(500);
              } else {
                const newSprint = new Sprint({
                  team: team,
                  number: req.body.sprint.number,
                  stories: req.body.sprint.stories,
                  current: req.body.sprint.current,
                });
                team.sprints.push(newSprint._id);
                for (let i = 0; i < req.body.sprint.stories.length; i++) {
                  Story.findById(req.body.sprint.stories[i], function (
                    err,
                    story
                  ) {
                    story.sprint = newSprint;
                    story.save();
                  });
                }
                team.save((error) => {
                  if (error) {
                    res.sendStatus(500);
                  } else {
                    newSprint.save((error) => {
                      if (!error) {
                        Team.findById(team._id)
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
                              res.json(transaction);
                            }
                          });
                        //res.json({ sprints: team.sprints });
                      } else {
                        res.sendStatus(500);
                      }
                    });
                  }
                });
              }
            }
          }
        );
      }
    }
  });
});
// GET ALL SPRINTS FOR A TEAM
router.get("/sprint/:teamId", function (req, res) {
  Sprint.find({ team: req.params.teamId })
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
});
