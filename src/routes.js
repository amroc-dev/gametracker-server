require("dotenv").config();
const express = require("express");
const router = express.Router();
const mongo = require("./Mongo");
const gamesMeta = require("./GamesMeta")
const explain = require("./performance");
const explain_find = require("./performance");

async function doSearch(searchTerm, count, offset, sortMethod) {

  // const searchTermRegex = new RegExp(searchTerm);
  // let query = {
  //   $or: [
  //     { trackName: { $regex: searchTermRegex } },
  //     { "searchBlob.sellerName": { $regex: searchTermRegex } },
  //     // { tags: { $elemMatch: { $eq: searchTerm } } },
  //   ],
  // };

  console.log("Search term: " + searchTerm)

  const query = searchTerm.length === 0 ? {} : {$text: { $search : searchTerm} }

  let sortField = "lookupBlob.userRating.ratingCount";
  let sortDir = -1;

  switch (sortMethod.toLowerCase())
  {
    case "popularity":
      sortField = "lookupBlob.userRating.ratingCount";
    break;

    case "rating":
      sortField = "searchBlob.averageUserRating";
    break;

    case "release date":
      sortField = "lookupBlob.releaseDate";
    break;

    case "name":
      sortField = "trackName";
      sortDir = 1;
      break;

    default:
    break;
  }

  const options = {
    limit: count,
    skip: offset,
    // projection: { score: { "$meta": "textScore" } },
    // sort: { score: { "$meta": "textScore" } }
    sort: {
      [sortField] : sortDir,
    },
  };

  // explain_find(query, options)

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

  return returnBlob
}

router.post("/", async (req, res) => {
  const bodyObj = req.body;
  if (bodyObj.requestType == undefined) {
    console.log("invalid request: " + JSON.stringify(req.body));
    res.send("Not ok");
    return;
  }

  let dbData = null

  switch (bodyObj.requestType)
  {
    case "search":
      {
        const searchTerm = bodyObj.searchTerm;
        const count = bodyObj.count == undefined ? 20 : parseInt(bodyObj.count);
        const offset = bodyObj.offset == undefined ? 20 : parseInt(bodyObj.offset);
        const sortMethod = bodyObj.sortMethod == undefined ? "Popularity" : bodyObj.sortMethod;
        dbData = await doSearch(searchTerm, count, offset, sortMethod)
      }
      break;

    case "tags":
      {
        dbData = [...gamesMeta.tags];
      }

    default: 
    break;
  }


  res.send(dbData);
});

module.exports = router;
