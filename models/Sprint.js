const mongoose = require("mongoose");
const Story = require("./Story");
const Team = require("./Team");

let sprintSchema = new mongoose.Schema({
  team: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Team",
  },
  number: String,
  stories: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Sprint",
    },
  ],
  current: Boolean,
});

module.exports = mongoose.model("Sprint", sprintSchema);
