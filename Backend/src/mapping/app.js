const express = require('express');

const app = express();

// middleware
app.use(express.json());

// test route
app.get('/', (req, res) => {
  res.send('Backend is running');
});

const aiRoutes = require("../routes/ai.routes");

app.use(express.json());
app.use("/api", aiRoutes);

module.exports = app;
