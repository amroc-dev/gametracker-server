const mongo = require("./Mongo");
const { setIntervalAsync } = require("set-interval-async/dynamic");

async function getArray(id, arrayOut) {
  try {
    let query = { _id: id };
    const cursor = await mongo.collection_meta.find(query);
    const hasResult = await cursor.hasNext();

    if (!hasResult) {
      return;
    }

    const result = await cursor.next();
    arrayOut.length = 0;
    result[id].map((entry) => {
      arrayOut.push(entry);
      return null;
    });
  } catch (err) {
    console.log(err);
  }
}

class GamesMeta {
  constructor() {
    this.tags = [];
    this.popularityIntervals = []
  }

  async getData() {
    await getArray("tags", this.tags);
    await getArray("popularity_intervals", this.popularityIntervals);
  }

  async init() {
    console.log("Retreiving latest metadata...");
    await this.getData()
    // const interval = 60 * (60 * 1000) // refresh every 60 minutes
    // setIntervalAsync( this.getData, interval)
  }
}

module.exports = new GamesMeta();
