const mongo = require("./Mongo");

async function explain_find(query, options) {
    const explain = await await mongo.collection.find(query, options).explain("executionStats");
    const { 
        executionTimeMillis, 
        totalKeysExamined, 
        totalDocsExamined,
    } = explain.executionStats
    const {
        parsedQuery,
        indexFilterSet,

    } = explain.queryPlanner

    console.log("Results:")
    console.log( {
        parsedQuery,
        indexFilterSet,
        executionTimeMillis,
        totalKeysExamined,
        totalDocsExamined,
    })
}

module.exports = explain_find;