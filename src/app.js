require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const cors = require('cors');
const mongo = require('./Mongo');
const gamesMeta = require ('./GamesMeta');
const routes = require("./routes");

const app = express();
app.use(bodyParser.json());
app.use(cors());
app.use("/", routes);

const boot = async () => {
  await mongo.main();
  await gamesMeta.init();
  app.listen(3001);
};

boot();

// const AppStorePricingMatrix = require("app-store-pricing-matrix");

// const pricing = AppStorePricingMatrix.findBy({
//   tier: "1",
//   country: "FR"
// });

// console.log(AppStorePricingMatrix.tiers);     // => 0.99