const mongo = require("./Mongo");
const { setIntervalAsync } = require("set-interval-async/dynamic");

async function getTags(arrayOut) {
  try {
    console.log("Retreiving latest tags metadata...");
    let query = { _id: "tags" };
    const cursor = await mongo.collection_meta.find(query);
    const hasResult = await cursor.hasNext();

    if (!hasResult) {
      return;
    }

    const result = await cursor.next();
    console.log("Tags retrieved");
    arrayOut.length = 0;
    result.tags.map((tag) => {
      arrayOut.push(tag);
      return null;
    });
  } catch (err) {
    console.log(err);
  }
}

class GamesMeta {
  constructor() {
    this.tags = [];
  }

  async init() {
    await getTags(this.tags);
    const interval = 600000 // refresh every 10 mins
    setIntervalAsync( getTags, interval, this.tags )
  }
}

module.exports = new GamesMeta();
