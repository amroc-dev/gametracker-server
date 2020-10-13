require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const cors = require('cors');
const mongo = require('./Mongo');
const gamesMeta = require ('./GamesMeta');
const routes = require("./routes");
const slowDown = require("express-slow-down");
 
const app = express();

// speed limiter
app.enable("trust proxy"); // only if you're behind a reverse proxy (Heroku, Bluemix, AWS if you use an ELB, custom Nginx setup, etc)
const speedLimiter = slowDown({
  windowMs: 4 * 60 * 1000, // 
  delayAfter: 120, // 
  delayMs: 1250, // amount of ms delay to add per request over the limit (accumulates with every request)
  maxDelayMs: 1250 // don't accumulate past this amount
});
app.use(speedLimiter);

// status monitor
app.use(require('express-status-monitor')());

// body parser
app.use(bodyParser.json());

// cors
app.use(cors());

// routes
app.use("/", routes);

const boot = async () => {
  await mongo.main();
  await gamesMeta.init();
  app.listen(process.env.PORT || 80);
};

boot();

// const AppStorePricingMatrix = require("app-store-pricing-matrix");

// const pricing = AppStorePricingMatrix.findBy({
//   tier: "1",
//   country: "FR"
// });

// console.log(AppStorePricingMatrix.tiers);     // => 0.99