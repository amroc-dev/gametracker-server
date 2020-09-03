require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const routes = require("./routes");
const bodyParser = require("body-parser");

const app = express();

app.use(bodyParser.json());
app.use("/", routes);

//Connect to DB
mongoose.connect(process.env.DB_CONNECTION, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", function () {
  console.log("connected");
});

// const mySchema = new mongoose.Schema({
// });

// const myModel = mongoose.model("Games", mySchema, "Games");

// async function test() {
//   const result = await myModel.find({});
//   console.log(result);
// }

app.listen(3000);
