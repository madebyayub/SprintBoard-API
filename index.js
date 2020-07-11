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
  console.log("A client socket has connected");

  socket.on("join", ({ user, msg, channel }) => {
    console.log(user.name + msg);
  });

  socket.on("message", ({ user, msg }) => {
    console.log(user.name + ": " + msg);
    socket.broadcast.emit("message", {
      author: user,
      date: moment(),
      content: msg,
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
