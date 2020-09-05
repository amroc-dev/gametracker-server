require("dotenv").config();
const express = require("express");
const router = express.Router();
const blankModel = require("./models");

router.post("/", (req, res) => {
  const bodyObj = req.body;
  if (bodyObj.searchTerm == undefined) {
    console.log("invalid request: " + JSON.stringify(req.body))
    res.send("Not ok")
    return;
  }


  const count = bodyObj.count == undefined ? 20 : parseInt(bodyObj.count)
  const offset = bodyObj.offset == undefined ? 20 : parseInt(bodyObj.offset)


  const searchTerm = bodyObj.searchTerm;

  console.log("SearchTerm: " + searchTerm)

  const regex = new RegExp(searchTerm, "i");
  const query = {
    trackName: { $regex: regex },
  };
  blankModel
    .find(query)
    .lean()
    .limit(count)
    .skip(offset)
    .exec((err, doc) => {
      const items = doc.map(d => d.trackName);
      res.send(doc);
    });
});

module.exports = router;
