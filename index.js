/* 
  Backend API initialization 
*/
const express = require("express"),
  cors = require("cors"),
  mongoose = require("mongoose"),
  bp = require("body-parser"),
  User = require("./models/User"),
  Team = require("./models/Team"),
  Story = require("./models/Story"),
  Sprint = require("./models/Sprint"),
  app = express();

const teamRoutes = require("./routes/team"),
  storyRoutes = require("./routes/story"),
  userRoutes = require("./routes/user"),
  sprintRoutes = require("./routes/sprint");

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

// Routes associated with user

app.use(userRoutes);

// Routes associated with team

app.use(teamRoutes);

// Routes associated with stories

//app.use(storyRoutes);

// Routes associated with sprints

app.use(sprintRoutes);

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
      User.findById(req.body.story.assigned, function (err, assignedUser) {
        if (err) {
          res.sendStatus(500);
        } else {
          Story.findById({ _id: req.params.storyId }, function (err, story) {
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
                    Team.findById(team._id)
                      .populate({
                        path: "stories",
                        model: "Story",
                        populate: {
                          path: "author",
                          model: "User",
                        },
                      })
                      .populate({
                        path: "stories",
                        model: "Story",
                        populate: {
                          path: "sprint",
                          model: "Sprint",
                        },
                      })
                      .populate({
                        path: "stories",
                        model: "Story",
                        populate: {
                          path: "assigned",
                          model: "User",
                        },
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
                          res.json({
                            stories: transaction.stories,
                            sprints: transaction.sprints,
                          });
                        }
                      });
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
                        Team.findById(team._id)
                          .populate({
                            path: "stories",
                            model: "Story",
                            populate: {
                              path: "author",
                              model: "User",
                            },
                          })
                          .populate({
                            path: "stories",
                            model: "Story",
                            populate: {
                              path: "sprint",
                              model: "Sprint",
                            },
                          })
                          .populate({
                            path: "stories",
                            model: "Story",
                            populate: {
                              path: "assigned",
                              model: "User",
                            },
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
                              res.json({
                                stories: transaction.stories,
                                sprints: transaction.sprints,
                              });
                            }
                          });
                      }
                    });
                  }
                } else if (
                  prevSprint._id.toString() === req.body.story.sprint
                ) {
                  // CASE 3
                  Team.findById(team._id)
                    .populate({
                      path: "stories",
                      model: "Story",
                      populate: {
                        path: "author",
                        model: "User",
                      },
                    })
                    .populate({
                      path: "stories",
                      model: "Story",
                      populate: {
                        path: "sprint",
                        model: "Sprint",
                      },
                    })
                    .populate({
                      path: "stories",
                      model: "Story",
                      populate: {
                        path: "assigned",
                        model: "User",
                      },
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
                        res.json({
                          stories: transaction.stories,
                          sprints: transaction.sprints,
                        });
                      }
                    });
                } else if (prevSprint !== null) {
                  // CASE 4 and CASE 5
                  Sprint.findById(prevSprint, function (err, previousSprint) {
                    if (err) {
                      res.sendStatus(500);
                    } else {
                      previousSprint.stories = previousSprint.stories.filter(
                        (sprintStory) => {
                          return (
                            sprintStory._id.toString() !== story._id.toString()
                          );
                        }
                      );
                      previousSprint.save();
                      if (req.body.story.sprint === null) {
                        // CASE 4
                        Team.findById(team._id)
                          .populate({
                            path: "stories",
                            model: "Story",
                            populate: {
                              path: "author",
                              model: "User",
                            },
                          })
                          .populate({
                            path: "stories",
                            model: "Story",
                            populate: {
                              path: "sprint",
                              model: "Sprint",
                            },
                          })
                          .populate({
                            path: "stories",
                            model: "Story",
                            populate: {
                              path: "assigned",
                              model: "User",
                            },
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
                              res.json({
                                stories: transaction.stories,
                                sprints: transaction.sprints,
                              });
                            }
                          });
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
                            Team.findById(team._id)
                              .populate({
                                path: "stories",
                                model: "Story",
                                populate: {
                                  path: "author",
                                  model: "User",
                                },
                              })
                              .populate({
                                path: "stories",
                                model: "Story",
                                populate: {
                                  path: "sprint",
                                  model: "Sprint",
                                },
                              })
                              .populate({
                                path: "stories",
                                model: "Story",
                                populate: {
                                  path: "assigned",
                                  model: "User",
                                },
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
                                  res.json({
                                    stories: transaction.stories,
                                    sprints: transaction.sprints,
                                  });
                                }
                              });
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
  });
});

// GET THE ARRAY OF STORIES FROM A TEAM
app.get("/stories/:teamId", function (req, res) {
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

/*

  Server listen setup

*/
app.listen(PORT);
console.log("Backend API server listening on port " + PORT);
