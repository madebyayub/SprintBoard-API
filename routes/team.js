const express = require("express"),
  router = express.Router(),
  User = require("../models/User"),
  Team = require("../models/Team"),
  Story = require("../models/Story"),
  Sprint = require("../models/Sprint");

// POST ROUTE TO CREATE A TEAM
app.post("/team", function (req, res) {
  User.findOne({ userID: req.body.userID }, function (err, user) {
    if (err) {
      res.sendStatus(500);
    } else {
      Team.findOne({ name: req.body.teamname }, function (err, team) {
        if (!team) {
          if (err) {
            res.sendStatus(500);
          } else {
            if (!user) {
              const newUser = new User({
                userID: req.body.userID,
                name: req.body.username,
                profilePic: req.body.userpicture,
              });
              const newTeam = new Team({
                name: req.body.teamname,
                members: [newUser],
                lead: newUser,
                stories: [],
                sprints: [],
              });
              newUser.team = newTeam;
              newUser.save((error) => {
                if (!error) {
                  newTeam.save((error) => {
                    if (!error) {
                      res.json({ response: "Succesfully saved new team" });
                    } else {
                      res.sendStatus(500);
                    }
                  });
                } else {
                  res.sendStatus(500);
                }
              });
            } else {
              if (user.team.length > 0) {
                res.json({ response: "User is already apart of another team" });
              } else {
                const newTeam = new Team({
                  name: req.body.teamname,
                  members: [user],
                  lead: user,
                  stories: [],
                  sprints: [],
                });
                user.team = newTeam;
                user.save((error) => {
                  if (!error) {
                    newTeam.save((error) => {
                      if (!error) {
                        res.json({ response: "Succesfully saved new team" });
                      } else {
                        res.sendStatus(500);
                      }
                    });
                  } else {
                    res.sendStatus(500);
                  }
                });
              }
            }
          }
        } else {
          res.json({ response: "Team with that name already exists" });
        }
      });
    }
  });
});

// PATCH ROUTE TO UPDATE TEAM MEMBER INFORMATION
app.patch("/team", function (req, res) {
  Team.findOne({ name: req.body.teamname }, function (err, team) {
    if (err) {
      res.sendStatus(500);
    } else {
      User.findOne({ userID: req.body.userID }, function (err, user) {
        if (err) {
          res.sendStatus(500);
        } else {
          if (!user) {
            if (!team) {
              res.status(404).send("Team not found");
            } else {
              if (req.body.instruction === "ADD") {
                const newUser = new User({
                  userID: req.body.userID,
                  name: req.body.username,
                });
                newUser.team = team;
                team.members = [...team.members, newUser];
                newUser.save((error) => {
                  if (!error) {
                    team.save((error) => {
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
                              res.json({ team: transaction });
                            }
                          });
                      } else {
                        res.sendStatus(500);
                      }
                    });
                  } else {
                    res.sendStatus(500);
                  }
                });
              } else {
                res.sendStatus(404);
              }
            }
          } else {
            if (!team) {
              res.status(404).send("Team not found");
            } else {
              if (req.body.instruction === "ADD") {
                if (user.team.length > 0) {
                  res.json(user.team[0]);
                } else {
                  team.members = [...team.members, user];
                  user.team = team;
                  user.save((error) => {
                    if (!error) {
                      team.save((error) => {
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
                                res.json({ team: transaction });
                              }
                            });
                        } else {
                          res.sendStatus(500);
                        }
                      });
                    } else {
                      res.sendStatus(500);
                    }
                  });
                }
              } else if (req.body.instruction === "REMOVE") {
                Story.find({ team: team._id }, function (err, stories) {
                  if (err) {
                    res.sendStatus(500);
                  } else {
                    if (!stories) {
                      res.sendStatus(404);
                    } else {
                      stories.map((oneStory) => {
                        if (
                          oneStory.assigned &&
                          oneStory.assigned._id.toString() == user._id
                        ) {
                          Story.findByIdAndUpdate(
                            oneStory._id,
                            { assigned: null },
                            function (err) {
                              if (err) {
                                res.sendStatus(500);
                              }
                            }
                          );
                        }
                      });
                    }
                  }
                });
                let newMembers = team.members.filter((member) => {
                  return member.toString() != user._id;
                });
                team.members = newMembers;
                user.team = [];
                user.leader = false;
                user.save((error) => {
                  if (!error) {
                    team.save((error) => {
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
                          .exec((err, transaction) => {
                            if (err) {
                              res.sendStatus(500);
                            } else {
                              res.json({ team: transaction });
                            }
                          });
                      } else {
                        res.sendStatus(500);
                      }
                    });
                  } else {
                    res.sendStatus(500);
                  }
                });
              } else {
                res.sendStatus(404);
              }
            }
          }
        }
      });
    }
  });
});

router.get("/team/user/:id", function (req, res) {
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
// GET ROUTE TO GET A MATCH FOR A TEAM NAME PROVIDED BY ROUTE PARAMS
app.get("/team/:name", function (req, res) {
  Team.find({ name: req.params.name })
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
});
