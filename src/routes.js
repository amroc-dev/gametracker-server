require("dotenv").config();
const express = require("express");
const router = express.Router();
const mongo = require("./Mongo");
const gamesMeta = require("./GamesMeta");
const explain = require("./performance");
const explain_find = require("./performance");
const dbkeys = require('../shared/db-keys');
const usageCounters = require("./usage");

let searchProjectedFields = null

async function doSearch(searchTerm, count, offset, sortMethod, deviceFilter, popularityFilter, ratingFilter) {
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

  if (popularityFilter.min > -1 || popularityFilter.max > -1) {
    const comparisonObj = {}
    if (popularityFilter.min > -1) comparisonObj['$gte'] = popularityFilter.min
    if (popularityFilter.max > -1) comparisonObj['$lte'] = popularityFilter.max
    allQueries.push( {[dbkeys.popularity] : comparisonObj} );
  }
  // if (popularityFilter.ratingCount > 0) {
  //   const direction = popularityFilter.ascending ? '$gte' : '$lte'
  //   allQueries.push( {[dbkeys.popularity] : {[direction] : popularityFilter.ratingCount}} );
  // }

  if (ratingFilter > -1) {
    allQueries.push( {[dbkeys.ratingCurrentVersion] : {'$gte' : ratingFilter}} );
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

  // use project to only retreive the fields specified in dbkeys
  if (searchProjectedFields === null) {
    searchProjectedFields = {}
    Object.values(dbkeys).forEach( val => searchProjectedFields[val] = 1)
  }

  let options = {
    limit: count,
    skip: offset,
    sort: {
      [dbkeys.popularity]: -1,
    },
    projection: searchProjectedFields,
  };

  switch (sortMethod.toLowerCase()) {
    case "popularity":
      options.sort = { [dbkeys.popularity]: -1 };
      break;

    case "user rating":
      options.sort = { "metaRanking": -1 };
      break;

    case "release date":
      options.sort = { [dbkeys.releaseDate]: -1, "metaRanking": -1 };
      break;

    // case "oldest":
    //   options.sort = { [dbkeys.releaseDate]: 1, "metaRanking": -1 };
    //   break;

    // case "price - lowest":
    //   options.sort = { [dbkeys.price]: 1, "metaRanking": -1 };
    //   break;

    // case "price - highest":
    //   options.sort = { [dbkeys.price]: -1, "metaRanking": -1 };
    //   break;

    case "name":
      options.sort = { [dbkeys.trackName]: 1 };
      break;

    case "recently updated":
      options.sort = { [dbkeys.currentVersionReleaseDate]: -1 };
      break;

    default:
      break;
  }

//   console.log("Request:");
//   console.log(" - Query: " + JSON.stringify(query));
//   console.log(" - Sort: " + JSON.stringify(options.sort));

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
//   console.log('bodyObj: ' + bodyObj)

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
        const ratingFilter = bodyObj.ratingFilter == undefined ? "-1" : bodyObj.ratingFilter 
        dbData = await doSearch(
          searchTerm,
          count,
          offset,
          sortMethod,
          deviceFilter, 
          popularityFilter,
          ratingFilter,
        );
      }
      break;

    case "games_meta": {
      dbData = {
        "tags" : [...gamesMeta.tags],
        "popularityIntervals": [...gamesMeta.popularityIntervals],
        "releaseYears" : [...gamesMeta.releaseYears]
      }
    }

    default:
      break;
  }

  if (dbData !== null && req.slowDown) {
    dbData["rateData"] = req.slowDown
  }

  res.send(dbData);
});


// // apple sign in auth
// ////////////////////////////////////////////////////////////////////
// router.post("/auth", async (req, res) => {
  
//   console.log("Body: " + JSON.stringify(req.body, null, 4))
//   const { authorization, user } = req.body;
//   console.log("MM: auth: " + authorization + ", user: " + user)
// });

router.get("/___status2", async (req, res) => {
  let resultString = ""
  for (key in usageCounters) {
    resultString += ("<div>" + (key + ": " + usageCounters[key]) + "</div>")
  }
  res.send(resultString);
});

module.exports = router;
