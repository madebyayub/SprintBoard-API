/* 
  Backend API initialization 
*/
const express = require("express"),
  cors = require("cors"),
  socketio = require("socket.io"),
  mongoose = require("mongoose"),
  bp = require("body-parser"),
  http = require("http"),
  moment = require("moment"),
  User = require("./models/User"),
  Team = require("./models/Team"),
  Story = require("./models/Story"),
  Sprint = require("./models/Sprint"),
  Channel = require("./models/Channel"),
  Message = require("./models/Message"),
  app = express(),
  server = http.createServer(app),
  io = socketio(server);

const teamRoutes = require("./routes/team"),
  storyRoutes = require("./routes/story"),
  userRoutes = require("./routes/user"),
  sprintRoutes = require("./routes/sprint");
const helper = require("./helper");
const { trace } = require("console");

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

io.on("connection", (socket) => {
  socket.on("join", ({ user, channel }) => {
    console.log(
      user.name + " has joined the message board, in channel " + channel.name
    );
  });

  socket.on("message", ({ user, msg, channel }) => {
    socket.broadcast.emit("message", {
      author: user,
      date: moment(),
      content: msg,
    });
    User.findOne({ userID: user.userID }, function (err, foundUser) {
      if (!err) {
        if (foundUser) {
          Message.create(
            { author: foundUser, date: moment(), content: msg },
            function (err, newMessage) {
              if (!err) {
                Channel.findById(channel, function (err, userChannel) {
                  if (!err) {
                    if (userChannel) {
                      userChannel.messages.push(newMessage);
                      userChannel.save();
                    } else {
                      //do error checks
                    }
                  } else {
                    //do error checks
                  }
                });
              } else {
                //do error check
              }
            }
          );
        }
      }
    });
  });
  socket.on("populateChannel", ({ channel }) => {
    Channel.findById(channel)
      .populate({
        path: "messages",
        model: "Message",
        populate: { path: "author", model: "User" },
      })
      .populate({
        path: "members",
        model: "User",
      })
      .exec((err, transaction) => {
        io.to(`${socket.id}`).emit("receiveChannel", { channel: transaction });
      });
  });

  socket.on("searchChannel", ({ name }) => {
    Channel.find({ name: name, private: false }, function (err, channels) {
      if (!err) {
        io.to(`${socket.id}`).emit("searchChannelResults", {
          channels: channels,
        });
      }
    });
  });

  socket.on("joinChannel", ({ channel, user }) => {
    User.findById(user, function (err, foundUser) {
      if (!err) {
        if (foundUser) {
          Channel.findById(channel, function (err, foundChannel) {
            if (!err) {
              if (foundChannel) {
                foundChannel.members = [...foundChannel.members, foundUser];
                foundChannel.save((err) => {
                  if (!err) {
                    foundUser.channels = [...foundUser.channels, foundChannel];
                    foundUser.save((err) => {
                      if (!err) {
                        User.findById(foundUser._id)
                          .populate({
                            path: "channels",
                            model: "Channel",
                            populate: { path: "messages", model: "Message" },
                          })
                          .exec((err, transaction) => {
                            if (!err) {
                              io.to(`${socket.id}`).emit("channelListUpdate", {
                                user: transaction,
                                channel: foundChannel,
                              });
                            }
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
    });
  });

  socket.on("createChannel", ({ name, isPrivate, user }) => {
    User.findById(user, function (err, user) {
      if (!err) {
        if (user) {
          Channel.create(
            { name, messages: [], members: [user], private: isPrivate },
            function (err, channel) {
              if (!err) {
                if (channel) {
                  user.channels = [...user.channels, channel];
                  user.save((err) => {
                    if (!err) {
                      User.findById(user._id)
                        .populate({
                          path: "channels",
                          model: "Channel",
                          populate: { path: "messages", model: "Message" },
                        })
                        .exec((err, transaction) => {
                          if (!err) {
                            io.to(`${socket.id}`).emit("channelListUpdate", {
                              user: transaction,
                              channel: channel,
                            });
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
  socket.on("disconnect", () => {
    console.log("A user has left the chat");
  });
});

/*

  ROUTES

*/

// Routes associated with user

app.use(userRoutes);

// Routes associated with team

app.use(teamRoutes);

// Routes associated with stories

app.use(storyRoutes);

// Routes associated with sprints

app.use(sprintRoutes);

/*

  Server listen setup

*/
server.listen(PORT);
console.log("Backend API server listening on port " + PORT);
