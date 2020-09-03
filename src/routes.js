require("dotenv").config();
const express = require("express");
const router = express.Router();
const blankModel = require("./models");

router.post("/", async (req, res) => {
  const searchTerm = req.body.trackName;
  if (!searchTerm) {
    console.log("invalid request");
    return;
  }

  const regex = new RegExp(searchTerm, "i");
  console.log("Regex: " + regex);
  const query = {
    trackName: { $regex: regex },
  };
  blankModel
    .find(query)
    .lean()
    .exec((err, doc) => {
      const trackNames = doc.map((d) => d.trackName);
      res.send(trackNames);
    });
});

module.exports = router;
