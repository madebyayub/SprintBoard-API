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

app.use(storyRoutes);

// Routes associated with sprints

app.use(sprintRoutes);

/*

  Server listen setup

*/
app.listen(PORT);
console.log("Backend API server listening on port " + PORT);
