require("dotenv").config();
const { MongoClient } = require("mongodb");

class Mongo {
  constructor() {
    this.db = null;
    this.client = new MongoClient(process.env.DB_CONNECTION, {
      useUnifiedTopology: true,
    });
  }

  async main() {
    try {
      await this.client.connect();
      console.log("Connected to MongoDB");
      this.db = this.client.db("GameTracker");
      this.collection = this.db.collection("Games");
      this.collection_meta = this.db.collection("Games_meta");
    } catch (err) {
      console.log(err);
    }
  }
}

module.exports = new Mongo();
