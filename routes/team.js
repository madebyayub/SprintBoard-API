const express = require("express"),
  router = express.Router(),
  helper = require("../helper"),
  User = require("../models/User"),
  Team = require("../models/Team"),
  Story = require("../models/Story"),
  Sprint = require("../models/Sprint");

/* Post route to create a new team. Performs a check prior to ensure that a
   team with that name does not already exist. Responds with a message. */

router.post("/team", function (req, res) {
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

/* Patch route to update team information. Handles removing and adding a member
   and updating team name, depending on the instruction provided in the request body. */

router.patch("/team", function (req, res) {
  Team.findOne({ name: req.body.teamname }, function (err, team) {
    if (err) {
      res.sendStatus(500);
    } else {
      if (!team) {
        res.sendStatus(404);
      } else {
        // If the instruction is to just change name
        if (req.body.instruction === "CHANGE_NAME") {
          team.name = req.body.newTeamName;
          team.save((error) => {
            if (!error) {
              helper.populateTeam(req, res, team._id);
            } else {
              res.sendStatus(500);
            }
          });
          // If the instruction is either add or remove
        } else if (
          req.body.instruction === "ADD" ||
          req.body.instruction === "REMOVE"
        ) {
          User.findOne({ userID: req.body.userID }, function (err, user) {
            // If the instruction is add a user
            if (req.body.instruction === "ADD") {
              // If the user is new, and requests to join a team
              if (!user) {
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
                        helper.populateTeam(req, res, team._id);
                      } else {
                        res.sendStatus(500);
                      }
                    });
                  } else {
                    res.sendStatus(500);
                  }
                });
                // If the user already exists, and is not part of a team
              } else {
                if (user.team.length > 0) {
                  res.json(user.team[0]);
                } else {
                  team.members = [...team.members, user];
                  user.team = team;
                  user.save((error) => {
                    if (!error) {
                      team.save((error) => {
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
              }
              // If the instruction is to remove a member of a team
            } else {
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
        } else {
          res.sendStatus(404);
        }
      }
    }
  });
});

/* Route responsible for a fetch given a team name. Client side uses this response
   to determine if a team already exists with the given name. Does not require population. */

router.get("/team/:name", function (req, res) {
  Team.find({ name: req.params.name }).exec((err, transaction) => {
    if (err) {
      res.sendStatus(500);
    } else {
      res.json(transaction);
    }
  });
});

module.exports = router;
