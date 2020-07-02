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

/* ROUTES ASSOCIATED WITH USER */

// GET ROUTE TO GET USER INFORMATION
app.patch("/user", function (req, res) {
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
                Story.find({team: team._id}, function(err, stories){
                  if (err){
                    res.sendStatus(500);
                  }
                  else{
                    if(!stories){
                      res.sendStatus(404);
                    }
                    else{
                      stories.map((oneStory) => {
                        if( oneStory.assigned && oneStory.assigned._id.toString() == user._id){
                          Story.findByIdAndUpdate(oneStory._id,{assigned: null},function(err){
                            if (err){
                              res.sendStatus(500);
                            }
                          });
                        }
                      });
                    }
                  }
                })
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

app.post("/sprint", function (req, res) {
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
app.get("/sprint/:teamId", function (req, res) {
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
/*

  Server listen setup

*/
app.listen(PORT);
console.log("Backend API server listening on port " + PORT);
