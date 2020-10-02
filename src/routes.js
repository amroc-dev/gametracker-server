require("dotenv").config();
const express = require("express");
const router = express.Router();
const mongo = require("./Mongo");
const gamesMeta = require("./GamesMeta");
const explain = require("./performance");
const explain_find = require("./performance");
const dbkeys = require('../shared/db-keys')

async function doSearch(searchTerm, count, offset, sortMethod, deviceFilter) {
  // const searchTermRegex = new RegExp(searchTerm);
  // let query = {
  //   $or: [
  //     { trackName: { $regex: searchTermRegex } },
  //     { "searchBlob.sellerName": { $regex: searchTermRegex } },
  //     // { tags: { $elemMatch: { $eq: searchTerm } } },
  //   ],
  // };

  const allQueries = [];

  if (searchTerm.length > 0) {
    const searchTermQuery = { $text: { $search: searchTerm } };
    allQueries.push(searchTermQuery);
  }

  if (deviceFilter.length > 0) {
    const deviceFilterQuery = {
      "lookupBlob.deviceFamilies": { $all: deviceFilter },
    };
    allQueries.push(deviceFilterQuery);
  }

  let query = {};
  if (allQueries.length == 1) {
    query = allQueries[0];
  } else if (allQueries.length > 1) {
    query = {
      $and: allQueries,
    };
  }

  // const query = searchTerm.length === 0 ? {} : {$text: { $search : searchTerm} }

  // const query = {
  //   $and : [
  //     {$text: { $search : searchTerm} },
  //     { "lookupBlob.deviceFamilies": { $all: deviceFilter } }
  //   ]
  // }

  // const query = { "lookupBlob.deviceFamilies": { $all: deviceFilter } }

  let sortOptions = {
    limit: count,
    skip: offset,
    sort: {
      [dbkeys.popularity]: -1,
    },
  };

  switch (sortMethod.toLowerCase()) {
    case "popularity":
      sortOptions.sort = { [dbkeys.popularity]: -1 };
      break;

    case "rating":
      sortOptions.sort = { "metaRanking": -1 };
      break;

    case "newest":
      sortOptions.sort = { [dbkeys.releaseDate]: -1, "metaRanking": -1 };
      break;

    case "oldest":
      sortOptions.sort = { [dbkeys.releaseDate]: 1, "metaRanking": -1 };
      break;

    case "price - lowest":
      sortOptions.sort = { [dbkeys.price]: 1, "metaRanking": -1 };
      break;

    case "price - highest":
      sortOptions.sort = { [dbkeys.price]: -1, "metaRanking": -1 };
      break;

    case "name":
      sortOptions.sort = { [dbkeys.trackName]: 1 };
      break;

    default:
      break;
  }

  console.log("Request:");
  console.log(" - Query: " + JSON.stringify(query));
  console.log(" - Sort: " + JSON.stringify(sortOptions.sort));

  explain_find(query, sortOptions)

  const cursor = await mongo.collection.find(query, sortOptions);
  // const test = cursor.explain("executionStats");
  const results = [];
  let resultsCount = 0;

  if (offset == 0) {
    resultsCount = await cursor.count();
  }

  await cursor.forEach((r) => results.push(r));
  const returnBlob = {
    resultsCount,
    results,
  };

  return returnBlob;
}

////////////////////////////////////////////////////////////////////

router.post("/", async (req, res) => {
  const bodyObj = req.body;
  if (bodyObj.requestType == undefined) {
    console.log("invalid request: " + JSON.stringify(req.body));
    res.send("Not ok");
    return;
  }

  let dbData = null;

  switch (bodyObj.requestType) {
    case "search":
      {
        const searchTerm = bodyObj.searchTerm;
        const count = bodyObj.count == undefined ? 20 : parseInt(bodyObj.count);
        const offset =
          bodyObj.offset == undefined ? 20 : parseInt(bodyObj.offset);
        const sortMethod =
          bodyObj.sortMethod == undefined ? "Popularity" : bodyObj.sortMethod;
        const deviceFilter =
          bodyObj.deviceFilter == undefined ? [] : bodyObj.deviceFilter;
        dbData = await doSearch(
          searchTerm,
          count,
          offset,
          sortMethod,
          deviceFilter
        );
      }
      break;

    case "tags": {
      dbData = [...gamesMeta.tags];
    }

    default:
      break;
  }

  res.send(dbData);
});

module.exports = router;
