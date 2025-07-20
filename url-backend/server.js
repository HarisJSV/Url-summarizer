const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
require('dotenv').config();
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

app.post('/api/summarize', async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: 'Missing URL' });

  try {
    const response = await axios.get(url);
    const $ = cheerio.load(response.data);
    const content = $('p').map((_, el) => $(el).text()).get().join(' ').slice(0, 3000);

    const openRouterRes = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: "openai/gpt-3.5-turbo",  // or try "mistralai/mistral-7b-instruct" (faster, free)
        messages: [
          {
            role: "user",
            content: `Summarize the following content and give 5 key points:\n\n${content}`
          }
        ]
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const output = openRouterRes.data.choices?.[0]?.message?.content || 'No summary found';
    const lines = output.split('\n').filter(l => l.trim());
    const summary = lines[0];
    const points = lines.slice(1, 6);

    res.json({ summary, points });
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

app.listen(3000, () => console.log('Server running on http://localhost:3000'));
