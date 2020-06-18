/* 
  Backend API initialization 
*/
var express = require("express"),
  cors = require("cors"),
  mongoose = require("mongoose"),
  bp = require("body-parser"),
  User = require("./models/User"),
  Team = require("./models/Team"),
  Story = require("./models/Story"),
  Sprint = require("./models/Sprint"),
  app = express();

app.use(cors());
app.use(bp.json());
app.use(bp.urlencoded({ extended: true }));

const PORT = process.env.PORT || 3001;

mongoose.connect(
  process.env.MONGODB_URI ||
    "mongodb+srv://admin:admin@sprintboardcluster-mtbzm.mongodb.net/SprintBoard?retryWrites=true&w=majority" ||
    "mongodb://localhost/sprintboard",
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: true,
  }
);

mongoose.connection.on("connected", () => {
  console.log("Connected to Mongoose Database");
});

/*

  ROUTES

*/

/* ROUTES ASSOCIATED WITH TEAM */

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
                let newMembers = team.members.filter((member) => {
                  return member.toString() != user._id;
                });
                team.members = newMembers;
                user.team = [];
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
          }
        }
      });
    }
  });
});
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
});

/* ROUTES ASSOCIATED WITH STORIES */

// DELETE A STORY, AND REMOVE FROM TEAM ARRAY
app.delete("/story", function (req, res) {
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
              Team.findById(team._id)
                .populate({
                  path: "stories",
                  model: "Story",
                  populate: { path: "author", model: "User" },
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
                    res.json({ stories: transaction.stories });
                  }
                });
            }
          });
        }
      });
    }
  });
});

// ADD A STORY TO A TEAM
app.post("/story", function (req, res) {
  Team.findById(req.body.team._id, function (err, team) {
    if (err) {
      res.sendStatus(500);
    } else {
      if (!team) {
        res.sendStatus(404);
      } else {
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
                      sprint: null,
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
                      sprint: null,
                    });
                  }
                  team.stories.push(newStory._id);
                  team.save((error) => {
                    if (!error) {
                      newStory.save((error) => {
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
                              populate: { path: "assigned", model: "User" },
                            })
                            .populate("members")
                            .populate("sprints")
                            .exec((err, transaction) => {
                              if (err) {
                                res.sendStatus(500);
                              } else {
                                res.json({ stories: transaction.stories });
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
              });
            }
          }
        });
      }
    }
  });
});

// EDIT USER STORY
app.put("/story/:storyId", function (req, res) {
  Team.findById(req.body.team._id, function (err, team) {
    if (err) {
      res.sendStatus(500);
    } else {
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
                if (!assignedUser) {
                  Story.findById({ _id: req.params.storyId }, function (
                    err,
                    story
                  ) {
                    if (err) {
                      res.sendStatus(500);
                    } else {
                      if (!story) {
                        res.sendStatus(404);
                      } else {
                        story.title = req.body.story.title;
                        story.author = user;
                        story.description = req.body.story.description;
                        story.status = req.body.story.status;
                        story.assigned = null;
                        story.points = req.body.story.point;
                        story.team = team;
                        story.sprint = null;
                        story.save();
                        Team.findById(team._id)
                          .populate({
                            path: "stories",
                            model: "Story",
                            populate: { path: "author", model: "User" },
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
                              res.json(transaction.stories);
                            }
                          });
                      }
                    }
                  });
                } else {
                  Story.findById({ storyID: req.params.storyId }, function (
                    err,
                    story
                  ) {
                    if (err) {
                      res.sendStatus(500);
                    } else {
                      if (!story) {
                        res.sendStatus(404);
                      } else {
                        (story.title = req.story.title),
                          (story.author = user),
                          (story.description = req.body.story.description),
                          (story.status = req.body.story.status),
                          (story.assigned = assignedUser),
                          (story.points = req.body.story.point),
                          (story.team = team),
                          (story.sprint = null);
                        story.save();
                        res.json(story);
                      }
                    }
                  });
                }
              }
            });
          }
        }
      });
    }
  });
});

// GET THE ARRAY OF STORIES FROM A TEAM
app.get("/stories/:teamId", function (req, res) {
  Story.find({ team: req.params.teamId })
    .populate("author")
    .populate("assigned")
    .exec((err, transaction) => {
      if (err) {
        res.sendStatus(500);
      } else {
        res.json({ stories: transaction });
      }
    });

  /*
  Story.find({ team: req.params.teamId }, function (err, stories) {
    if (err) {
      res.sendStatus(404);
    } else {
      res.json({ stories });
    }
  });*/
});

app.post("/sprint", function (req, res) {
  Team.findById(req.body.team._id, function (err, team) {
    if (err) {
      res.sendStatus(500);
    } else {
      if (!team) {
        res.send("team not found");
      } else {
        Sprint.findOne({ number: req.body.sprint.number }, function (
          err,
          sprint
        ) {
          if (!sprint) {
            if (err) {
              res.sendStatus(500);
            } else {
              const newSprint = new Sprint({
                team: team,
                number: req.body.sprint.number,
                stories: [],
                current: req.body.sprint.current,
              });
              team.sprints.push(newSprint._id);
              team.save((error) => {
                if (error) {
                  res.sendStatus(500);
                } else {
                  newSprint.save((error) => {
                    if (!error) {
                      res.json({ sprints: team.sprints });
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
    }
  });
});
// GET ALL SPRINTS FOR A TEAM
app.get("/sprint/:teamId", function (req, res) {
  Sprint.find({ team: req.params.teamId }, function (err, sprints) {
    if (err) {
      res.sendStatus(500);
    } else {
      if (!sprints) {
        res.sendStatus(404);
      } else {
        res.json(sprints);
      }
    }
  });
});
/*

  Server listen setup

*/
app.listen(PORT);
console.log("Backend API server listening on port " + PORT);
