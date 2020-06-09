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
      res.json({ response: "POST - ERROR FINDING THE USER" });
    } else {
      if (!user) {
        const newUser = new User({
          userID: req.body.userID,
          name: req.body.username,
        });
        const newTeam = new Team({
          name: req.body.teamname.toLowerCase(),
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
                res.json({ response: "Error saving new team" });
              }
            });
          } else {
            res.json({ response: "Error saving new user" });
          }
        });
      }
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
                        res.json(team);
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
                if (user.team) {
                  res.json(user.team);
                } else {
                  team.members = [...team.members, user];
                  user.team = team;
                  user.save((error) => {
                    if (!error) {
                      team.save((error) => {
                        if (!error) {
                          res.json(team);
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
                user.team = null;
                user.save((error) => {
                  if (!error) {
                    team.save((error) => {
                      if (!error) {
                        res.json(team);
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
app.get("/team", function (req, res) {
  User.findOne({ userID: req.body.userID }, function (err, user) {
    if (err) {
      res.sendStatus(500);
    } else {
      if (user) {
        Team.findById(user.team, function (err, team) {
          if (err) {
            res.status(404).send("Team not found");
          } else {
            res.json({ team });
          }
        });
      } else {
        res.status(404).send("User not found");
      }
    }
  });
});
// GET ROUTE TO GET A MATCH FOR A TEAM NAME PROVIDED BY ROUTE PARAMS
app.get("/team/:name", function (req, res) {
  Team.find({ name: req.params.name }, function (err, teams) {
    if (err) {
      res.sendStatus(500);
    } else {
      res.json(teams);
    }
  });
});
/*

  Server listen setup

*/
app.listen(PORT);
console.log("Backend API server listening on port " + PORT);
