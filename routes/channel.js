const express = require("express"),
  router = express.Router(),
  Channel = require("../models/Channel");

router.get("/channel/:name", function (req, res) {
  Channel.findOne({ name: req.params.name }, function (err, channel) {
    if (!err) {
      if (channel) {
        res.json({ channel: "exists" });
      } else {
        res.json({});
      }
    } else {
      res.sendStatus(500);
    }
  });
});

module.exports = router;
