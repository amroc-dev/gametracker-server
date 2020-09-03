require("dotenv").config();
const express = require("express");
const router = express.Router();
const blankModel = require("./models");

router.post("/", async (req, res) => {
  const result = await blankModel.find({});
  res.send("Posted");
  console.log(result);
});

module.exports = router;
