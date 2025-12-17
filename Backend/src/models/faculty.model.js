const mongoose = require("mongoose");

const facultySchema = new mongoose.Schema({
  name: String,
  email: String,
  department: String
});

module.exports = mongoose.model("Faculty", facultySchema);
