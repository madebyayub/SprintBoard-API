const mongoose = require("mongoose");

let teamSchema = new mongoose.Schema({
  name: String,
  members: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  lead: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  stories: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Story",
    },
  ],
  sprints: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Sprint",
    },
  ],
});

module.exports = mongoose.model("Team", teamSchema);
