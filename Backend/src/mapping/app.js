const express = require("express");
const cors = require("cors");
const app = express();

app.use(cors());
app.use(express.json());

const facultyRoutes = require("../routes/faculty.routes");
const organizationRoutes = require("../routes/organization.routes");

app.use("/api", facultyRoutes);
app.use("/api/organization", organizationRoutes);

app.get("/", (req, res) => {
  res.send("Backend is running");
});

module.exports = app;
