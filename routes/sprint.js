const express = require("express"),
  router = express.Router(),
  helper = require("../helper"),
  User = require("../models/User"),
  Team = require("../models/Team"),
  Story = require("../models/Story"),
  Sprint = require("../models/Sprint");

/* POST route to create a new Sprint for a team */

router.post("/sprint", function (req, res) {
  Team.findById(req.body.team._id, function (err, team) {
    if (err) {
      res.sendStatus(500);
    } else {
      if (!team) {
        res.sendStatus(404);
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
                        helper.populateTeam(req, res, team._id);
                      } else {
                        res.sendStatus(500);
                      }
                    });
                  }
                });
              }
            } else {
              res.sendStatus(404);
            }
          }
        );
      }
    }
  });
});

/* DELETE route to delete a sprint */

router.delete("/sprint", function (req, res) {
  Team.findById(req.body.teamId)
    .populate("stories")
    .exec(function (err, team) {
      if (err) {
        res.sendStatus(500);
      } else {
        if (!team) {
          res.sendStatus(404);
        } else {
          Sprint.findById(req.body.sprintId, function (err, sprint) {
            if (err) {
              res.sendStatus(500);
            } else {
              if (!sprint) {
                res.sendStatus(404);
              } else {
                const filteredSprints = team.sprints.filter((onesprint) => {
                  return onesprint._id.toString() !== sprint._id.toString();
                });
                const filteredStories = team.stories.filter((story) => {
                  return !story.sprint || story.sprint.toString() !== sprint._id.toString();
                });
                Story.deleteMany({ sprint: sprint._id }, (err, stories) => {
                  if (err) {
                    res.sendStatus(500);
                  } else {
                    Sprint.findByIdAndDelete(
                      sprint._id,
                      (err, deletedsprint) => {
                        if (err) {
                          res.sendStatus(500);
                        } else {
                          team.stories = filteredStories;
                          team.sprints = filteredSprints;
                          team.save((err) => {
                            if (err) {
                              res.sendStatus(500);
                            } else {
                              helper.populateTeam(req, res, team._id);
                            }
                          });
                        }
                      }
                    );
                  }
                });
              }
            }
          });
        }
      }
    });
});

/* GET route to fetch all the sprints of a team */

router.get("/sprint/:teamId", function (req, res) {
  helper.populateSprint(req, res, req.params.teamId);
});

module.exports = router;
