const express = require("express");
const router = express.Router();

const {
  addFaculty,
  searchFaculty
} = require("../controllers/faculty.controller");

// POST
router.post("/faculty", addFaculty);

// GET search
router.get("/faculty/search", searchFaculty);

module.exports = router;
