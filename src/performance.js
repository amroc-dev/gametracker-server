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

    console.log("Explain results: " + JSON.stringify({
        parsedQuery,
        indexFilterSet,
        executionTimeMillis,
        totalKeysExamined,
        totalDocsExamined,
    }))
}

module.exports = explain_find;