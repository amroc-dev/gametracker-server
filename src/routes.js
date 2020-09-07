require("dotenv").config();
const express = require("express");
const router = express.Router();
const mongo = require('./Mongo');

router.post("/", async (req, res) => {
  const bodyObj = req.body;
  if (bodyObj.searchTerm == undefined) {
    console.log("invalid request: " + JSON.stringify(req.body));
    res.send("Not ok");
    return;
  }

  const count = bodyObj.count == undefined ? 20 : parseInt(bodyObj.count);
  const offset = bodyObj.offset == undefined ? 20 : parseInt(bodyObj.offset);

  const searchTerm = bodyObj.searchTerm;

  console.log("SearchTerm: " + searchTerm);

  const regex = new RegExp(searchTerm, "i");
  const query = {
    trackName: { $regex: regex },
  };

  const options = {
    limit : count,
    skip : offset,
  }

  const cursor = await mongo.collection.find(query, options);
  const results = []
  await cursor.forEach( r => results.push(r));
  res.send(results);
});

module.exports = router;
