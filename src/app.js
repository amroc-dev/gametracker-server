require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongo = require("./Mongo");
const gamesMeta = require("./GamesMeta");
const routes = require("./routes");
const slowDown = require("express-slow-down");
const expressSession = require("express-session");
const MemoryStore = require("memorystore")(expressSession);
const expressVisitorCounter = require("./visitor-counter");
const usageCounters = require("./usage");

const app = express();

// speed limiter
app.enable("trust proxy"); // only if you're behind a reverse proxy (Heroku, Bluemix, AWS if you use an ELB, custom Nginx setup, etc)
const speedLimiter = slowDown({
  windowMs: 4 * 60 * 1000, //
  delayAfter: 120, //
  delayMs: 1250, // amount of ms delay to add per request over the limit (accumulates with every request)
  maxDelayMs: 1250, // don't accumulate past this amount
});
app.use(speedLimiter);

// status monitor
app.use(require("express-status-monitor")({ path: "/__status" }));

app.use(
  expressSession({
    cookie: { maxAge: 86400000 },
    store: new MemoryStore({
      checkPeriod: 86400000, // prune expired entries every 24h
    }),
    secret: "secret",
    resave: false,
    saveUninitialized: true,
  })
);

// visitor monitor
app.use(
  expressVisitorCounter({
    hook: (counterId) =>
      (usageCounters[counterId] = (usageCounters[counterId] || 0) + 1),
  })
);

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// cors
app.use(cors());

// routes
app.use("/", routes);

const boot = async () => {
  await mongo.main();
  await gamesMeta.init();
  app.listen(process.env.PORT || 80);
  console.log("Server started")
};

boot();

// const AppStorePricingMatrix = require("app-store-pricing-matrix");

// const pricing = AppStorePricingMatrix.findBy({
//   tier: "1",
//   country: "FR"
// });

// console.log(AppStorePricingMatrix.tiers);     // => 0.99
