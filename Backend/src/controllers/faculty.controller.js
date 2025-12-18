const Faculty = require("../models/faculty.model");

const addFaculty = async (req, res) => {
  try {
    const faculty = await Faculty.create(req.body);
    res.status(201).json({ success: true, faculty });
  } catch (err) {
    console.error("ADD FACULTY ERROR:", err);
    res.status(500).json({ error: err.message });
  }
};

const searchFaculty = async (req, res) => {
  try {
    const { q } = req.query;

    const faculty = await Faculty.find({
      name: { $regex: q, $options: "i" }
    });

    res.status(200).json({ success: true, faculty });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  addFaculty,
  searchFaculty
};
