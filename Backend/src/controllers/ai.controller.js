const { askGemini } = require("../services/gemini.services");

const askAI = async (req, res) => {
  try {
    const { question } = req.body;

    if (!question) {
      return res.status(400).json({ error: "Question is required" });
    }

    const answer = await askGemini(question);

    res.json({
      success: true,
      answer,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "AI service failed" });
  }
};

module.exports = { askAI };
