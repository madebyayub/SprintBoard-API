const mongoose = require("mongoose");

let storySchema = new mongoose.Schema({
  title: String,
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  description: String,
  status: String,
  assigned: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  points: String,
  team: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Team",
  },
  sprint: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Sprint",
  },
});

module.exports = mongoose.model("Story", storySchema);
