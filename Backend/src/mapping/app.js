const express = require("express");
const app = express();

app.use(express.json());

const facultyRoutes = require("../routes/faculty.routes");
app.use("/api", facultyRoutes);

app.get("/", (req, res) => {
  res.send("Backend is running");
});

module.exports = app;
