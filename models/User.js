const mongoose = require("mongoose");

let userSchema = new mongoose.Schema({
  userID: String,
  name: String,
  profilePic: String,
  team: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Team",
    },
  ],
  leader: Boolean,
  channels: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Channel",
    }
  ],
});

module.exports = mongoose.model("User", userSchema);
