const mongoose = require("mongoose");

let messageSchema = new mongoose.Schema({
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  date: String,
  content: String,
});

module.exports = mongoose.model("Message", messageSchema);
