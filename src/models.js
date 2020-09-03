require("dotenv").config();
const mongoose = require("mongoose");

const blank = mongoose.Schema({
})

module.exports = mongoose.model('blank', blank, process.env.DB_COLLECTION);