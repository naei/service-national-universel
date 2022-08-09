const mongoose = require("mongoose");

const File = new mongoose.Schema({
  name: String,
  size: Number,
  uploadedAt: Date,
  mimetype: String,
});

module.exports = File;
