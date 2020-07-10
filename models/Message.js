const mongoose = require("mongoose");
const moment = require("moment");

let messageSchema = new mongoose.Schema({
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  date: String,
  content: String,
});

module.exports = mongoose.model("Message", messageSchema);
