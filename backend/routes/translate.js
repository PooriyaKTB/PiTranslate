const express = require('express');
const router = express.Router();
const OpenAI = require("openai");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});


router.post('/', async (req, res) => {
  const { inputText, targetLang, inputLang } = req.body;
  try {
    const prompt = `Translate this ${inputLang || 'auto-detected'} text to ${targetLang}:
"${inputText}"`;

    const response = await openai.createChatCompletion({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.4
    });

    res.json({ translation: response.data.choices[0].message.content.trim() });
  } catch (err) {
    res.status(500).json({ error: 'Translation failed', details: err.message });
  }
});

module.exports = router;