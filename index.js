/* 
  Backend API initialization 
*/
const express = require("express"),
  cors = require("cors"),
  socketio = require ("socket.io"),
  mongoose = require("mongoose"),
  bp = require("body-parser"),
  http = require('http'),
  User = require("./models/User"),
  Team = require("./models/Team"),
  Story = require("./models/Story"),
  Sprint = require("./models/Sprint"),
  app = express(),
  server = http.createServer(app),
  io = socketio(server);

const teamRoutes = require("./routes/team"),
  storyRoutes = require("./routes/story"),
  userRoutes = require("./routes/user"),
  sprintRoutes = require("./routes/sprint");
const { Socket } = require("dgram");

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

io.on('connection', (socket) =>{
  console.log('we got socket connected');

  socket.on('join', ({message}) => {
    console.log(message);
  })
  socket.on('disconnect', () => {
    console.log('user has left the chat');
  })

})

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