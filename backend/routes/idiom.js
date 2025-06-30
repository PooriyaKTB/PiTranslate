const express = require('express');
const router = express.Router();
const OpenAI = require("openai");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});


router.post('/', async (req, res) => {
  const { inputText } = req.body;
  try {
    const prompt = `Give one common idiom in English that is conceptually related to this phrase: "${inputText}". Include the idiom and its explanation.`;

    const response = await openai.createChatCompletion({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7
    });

    res.json({ idiom: response.data.choices[0].message.content.trim() });
  } catch (err) {
    res.status(500).json({ error: 'Idiom lookup failed', details: err.message });
  }
});

module.exports = router;