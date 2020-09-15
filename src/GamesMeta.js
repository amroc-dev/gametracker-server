const mongo = require("./Mongo");

class GamesMeta {
    constructor() {
      this.tags = []
    }
  
    async init() {
      try {
       
        let query = { _id : "tags" } 
        const cursor = await mongo.collection_meta.find(query);
        const hasResult = await cursor.hasNext();
    
        if (!hasResult) {
          return
        }

        const result = await cursor.next();
        this.tags = [...result.tags];

      } catch (err) {
        console.log(err);
      }
    }
  }
  
  module.exports = new GamesMeta();
  