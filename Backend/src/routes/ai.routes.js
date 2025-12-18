const express = require("express");
const router = express.Router();

const { askAI } = require("../controllers/ai.controller");

router.post("/ask-ai", askAI);

module.exports = router;
