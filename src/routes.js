require("dotenv").config();
const express = require("express");
const router = express.Router();
const mongo = require("./Mongo");

router.post("/", async (req, res) => {
  const bodyObj = req.body;
  if (bodyObj.searchTerm == undefined) {
    console.log("invalid request: " + JSON.stringify(req.body));
    res.send("Not ok");
    return;
  }

  const count = bodyObj.count == undefined ? 20 : parseInt(bodyObj.count);
  const offset = bodyObj.offset == undefined ? 20 : parseInt(bodyObj.offset);

  const searchTerm = bodyObj.searchTerm.toLowerCase();

  console.log("SearchTerm: " + searchTerm);

  const searchTermRegex = new RegExp(searchTerm, "i");
  // const query = {
  //     trackName: { $regex: regex },
  // };
  const query = {
    $or: [
      { trackName: { $regex: searchTermRegex } },
      { "searchBlob.sellerName": { $regex: searchTermRegex } },
      { tags: { $elemMatch: { $eq: searchTerm } } },
    ],
  };

  const options = {
    limit: count,
    skip: offset,
    sort: {
      "lookupBlob.userRating.ratingCount": -1,
      // "lookupBlob.userRating.value": -1,
    },
  };

  const cursor = await mongo.collection.find(query, options);
  const results = [];
  let resultsCount = 0;

  if (offset == 0) {
    resultsCount = await cursor.count();
  }

  await cursor.forEach((r) => results.push(r));
  const returnBlob = {
    resultsCount,
    results,
  }

  res.send(returnBlob);
});

module.exports = router;
