const express = require('express');
const router = express.Router();
const { Configuration, OpenAIApi } = require('openai');

const configuration = new Configuration({ apiKey: process.env.OPENAI_API_KEY });
const openai = new OpenAIApi(configuration);

router.post('/', async (req, res) => {
  const { inputText } = req.body;
  try {
    const prompt = `Provide a list of common synonyms and 2 usage examples for the word or phrase: "${inputText}"`;

    const response = await openai.createChatCompletion({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.5
    });

    const output = response.data.choices[0].message.content.trim();
    const [examples, synonyms] = output.split(/Synonyms?:/i);

    res.json({
      examples: examples.replace(/Examples?:/i, '').trim(),
      synonyms: synonyms ? synonyms.trim() : 'No synonyms found.'
    });
  } catch (err) {
    res.status(500).json({ error: 'Detail lookup failed', details: err.message });
  }
});

module.exports = router;