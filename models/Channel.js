const mongoose = require("mongoose");

let channelSchema = new mongoose.Schema({
  name: String,
  messages: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
    },
  ],
});

module.exports = mongoose.model("Channel", channelSchema);
