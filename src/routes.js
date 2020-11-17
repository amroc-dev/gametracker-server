require("dotenv").config();
const express = require("express");
const router = express.Router();
const mongo = require("./Mongo");
const gamesMeta = require("./GamesMeta");
const explain = require("./performance");
const explain_find = require("./performance");
const dbkeys = require('../shared/db-keys');
const usageCounters = require("./usage");

async function doSearch(searchTerm, count, offset, sortMethod, deviceFilter, popularityFilter) {
  // const searchTermRegex = new RegExp(searchTerm);
  // let query = {
  //   $or: [
  //     { trackName: { $regex: searchTermRegex } },
  //     { "searchBlob.sellerName": { $regex: searchTermRegex } },
  //     // { tags: { $elemMatch: { $eq: searchTerm } } },
  //   ],
  // };

  console.log("popFil: " + JSON.stringify(popularityFilter))

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

  if (popularityFilter.min > -1 || popularityFilter.max > -1) {
    const comparisonObj = {}
    if (popularityFilter.min > -1) comparisonObj['$gte'] = popularityFilter.min
    if (popularityFilter.max > -1) comparisonObj['$lte'] = popularityFilter.max
    console.log(JSON.stringify(comparisonObj))
    allQueries.push( {[dbkeys.popularity] : comparisonObj} );
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

  let options = {
    limit: count,
    skip: offset,
    sort: {
      [dbkeys.popularity]: -1,
    },
    projection: {
      [dbkeys.trackName]: 1,
      [dbkeys.trackId] : 1,
      [dbkeys.artworkUrl] : 1,
      [dbkeys.popularity] : 1,
      [dbkeys.rating] : 1,
      [dbkeys.releaseDate] : 1,
      [dbkeys.formattedPrice] : 1,
      [dbkeys.price] : 1,
      [dbkeys.artistName] : 1,
      [dbkeys.tags] : 1,
      [dbkeys.metaRanking] : 1,
    }
  };

  switch (sortMethod.toLowerCase()) {
    case "popularity":
      options.sort = { [dbkeys.popularity]: -1 };
      break;

    case "user rating":
      options.sort = { "metaRanking": -1 };
      break;

    case "newest":
      options.sort = { [dbkeys.releaseDate]: -1, "metaRanking": -1 };
      break;

    case "oldest":
      options.sort = { [dbkeys.releaseDate]: 1, "metaRanking": -1 };
      break;

    case "price - lowest":
      options.sort = { [dbkeys.price]: 1, "metaRanking": -1 };
      break;

    case "price - highest":
      options.sort = { [dbkeys.price]: -1, "metaRanking": -1 };
      break;

    case "name":
      options.sort = { [dbkeys.trackName]: 1 };
      break;

    default:
      break;
  }

  console.log("Request:");
  console.log(" - Query: " + JSON.stringify(query));
  console.log(" - Sort: " + JSON.stringify(options.sort));

  // explain_find(query, sortOptions)

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
        const popularityFilter = bodyObj.popularityFilter == undefined ? "-1" : bodyObj.popularityFilter
        dbData = await doSearch(
          searchTerm,
          count,
          offset,
          sortMethod,
          deviceFilter, 
          popularityFilter,
        );
      }
      break;

    case "tags": {
      dbData = [...gamesMeta.tags];
    }
    break;

    case "popularityIntervals": {
      dbData = [...gamesMeta.popularityIntervals];
    }
    break;

    default:
      break;
  }

  if (dbData !== null && req.slowDown) {
    dbData["rateData"] = req.slowDown
  }

  res.send(dbData);
});

router.get("/__status2", async (req, res) => {
  let resultString = ""
  for (key in usageCounters) {
    resultString += ("<div>" + (key + ": " + usageCounters[key]) + "</div>")
  }
  res.send(resultString);
});

module.exports = router;
