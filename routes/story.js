const express = require("express"),
  router = express.Router(),
  helper = require("../helper"),
  User = require("../models/User"),
  Team = require("../models/Team"),
  Story = require("../models/Story"),
  Sprint = require("../models/Sprint");

router.use(
  cors({
    origin: "http://www.sprintboard.ca",
  })
);

/* DELETE route to remove a story from a team's story array */

router.delete("/story", function (req, res) {
  // First delete story from team array
  Team.findById(req.body.story.team, function (err, team) {
    if (err) {
      res.sendStatus(500);
    } else {
      const newStories = team.stories.filter(
        (story) => story != req.body.story._id
      );
      team.stories = newStories;
      team.save((error) => {
        if (error) {
          res.sendStatus(500);
        } else {
          // Then delete story from story collection
          Story.findByIdAndDelete(req.body.story._id, function (err, story) {
            if (err) {
              res.sendStatus(500);
            } else {
              helper.populateTeam(req, res, team._id);
            }
          });
        }
      });
    }
  });
});

/* POST route to create a story */

router.post("/story", function (req, res) {
  Team.findById(req.body.team._id, function (err, team) {
    if (err) {
      res.sendStatus(500);
    } else {
      if (!team) {
        res.sendStatus(404);
      } else {
        Sprint.findOne({ number: req.body.story.sprint }, function (
          err,
          sprint
        ) {
          if (err) {
            res.sendStatus(500);
          } else {
            let sprintRef = null;
            if (!sprint) {
              sprintRef = null;
            } else {
              sprintRef = sprint._id;
            }
            User.findOne({ userID: req.body.story.user }, function (err, user) {
              if (err) {
                res.sendStatus(500);
              } else {
                if (!user) {
                  res.sendStatus(404);
                } else {
                  User.findOne({ userID: req.body.story.assigned }, function (
                    err,
                    assignedUser
                  ) {
                    if (err) {
                      res.sendStatus(500);
                    } else {
                      let newStory;
                      if (!assignedUser) {
                        newStory = new Story({
                          title: req.body.story.title,
                          author: user,
                          description: req.body.story.description,
                          status: req.body.story.status,
                          assigned: null,
                          points: req.body.story.points,
                          team: team,
                          sprint: sprintRef,
                        });
                      } else {
                        newStory = new Story({
                          title: req.body.story.title,
                          author: user,
                          description: req.body.story.description,
                          status: req.body.story.status,
                          assigned: assignedUser,
                          points: req.body.story.points,
                          team: team,
                          sprint: sprintRef,
                        });
                      }
                      if (sprintRef != null) {
                        sprint.stories.push(newStory._id);
                        sprint.save((error) => {
                          if (error) {
                            res.sendStatus(500);
                          }
                        });
                      }
                      team.stories.push(newStory._id);
                      team.save((error) => {
                        if (!error) {
                          newStory.save((error) => {
                            if (!error) {
                              helper.populateTeam(req, res, team._id);
                            } else {
                              res.sendStatus(500);
                            }
                          });
                        } else {
                          res.sendStatus(500);
                        }
                      });
                    }
                  });
                }
              }
            });
          }
        });
      }
    }
  });
});

/* PUT route to edit the contents of a story */

router.put("/story", function (req, res) {
  Team.findById(req.body.team._id, function (err, team) {
    if (err) {
      res.sendStatus(500);
    } else {
      if (!team) {
        res.sendStatus(404);
      } else {
        User.findById(req.body.story.assigned, function (err, assignedUser) {
          if (err) {
            res.sendStatus(500);
          } else {
            Story.findById(req.body.story._id, function (err, story) {
              if (err) {
                res.sendStatus(500);
              } else {
                if (!story) {
                  res.sendStatus(404);
                } else {
                  const prevSprint = story.sprint;
                  // Change Story attributes
                  story.title = req.body.story.title;
                  story.author = story.author;
                  story.description = req.body.story.description;
                  story.status = req.body.story.status;
                  story.assigned = assignedUser;
                  story.points = req.body.story.point;
                  story.team = team;
                  story.sprint = req.body.story.sprint;
                  story.save();
                  /* Change the story list of previous Sprint, and new Sprint 
                      CASE 1: BACKLOG TO BACKLOG
                      CASE 2: BACKLOG TO SPRINT
                      CASE 3: SAME SPRINT
                      CASE 4: SPRINT TO BACKLOG
                      CASE 5: SPRINT TO SPRINT */
                  // If new sprint is same as old sprint
                  if (prevSprint === null) {
                    if (req.body.story.sprint === null) {
                      // CASE 1
                      helper.populateTeam(req, res, team._id);
                    } else {
                      // CASE 2
                      Sprint.findById(req.body.story.sprint, function (
                        err,
                        newSprint
                      ) {
                        if (err) {
                          res.sendStatus(500);
                        } else {
                          newSprint.stories.push(story._id);
                          newSprint.save();
                          helper.populateTeam(req, res, team._id);
                        }
                      });
                    }
                  } else if (
                    prevSprint._id.toString() === req.body.story.sprint
                  ) {
                    // CASE 3
                    helper.populateTeam(req, res, team._id);
                  } else if (prevSprint !== null) {
                    // CASE 4 and CASE 5
                    Sprint.findById(prevSprint, function (err, previousSprint) {
                      if (err) {
                        res.sendStatus(500);
                      } else {
                        previousSprint.stories = previousSprint.stories.filter(
                          (sprintStory) => {
                            return (
                              sprintStory._id.toString() !==
                              story._id.toString()
                            );
                          }
                        );
                        previousSprint.save();
                        if (req.body.story.sprint === null) {
                          // CASE 4
                          helper.populateTeam(req, res, team._id);
                        } else {
                          // CASE 5
                          Sprint.findById(req.body.story.sprint, function (
                            err,
                            newSprint
                          ) {
                            if (err) {
                              res.sendStatus(500);
                            } else {
                              newSprint.stories.push(story._id);
                              newSprint.save();
                              helper.populateTeam(req, res, team._id);
                            }
                          });
                        }
                      }
                    });
                  }
                }
              }
            });
          }
        });
      }
    }
  });
});

/* GET route to fetch all stories that belong to a team */

router.get("/story/:teamId", function (req, res) {
  Story.find({ team: req.params.teamId })
    .populate("author")
    .populate("assigned")
    .populate("sprint")
    .exec((err, transaction) => {
      if (err) {
        res.sendStatus(500);
      } else {
        res.json({ stories: transaction });
      }
    });
});

module.exports = router;
