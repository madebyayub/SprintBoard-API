const mongoose = require("mongoose");

let channelSchema = new mongoose.Schema({
  name: String,
  messages: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
    },
  ],
  private: Boolean,
  members: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
});

module.exports = mongoose.model("Channel", channelSchema);
