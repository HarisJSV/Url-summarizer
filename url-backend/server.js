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

    // Get body text instead of just <p> tags
    const rawText = $('body').text().replace(/\s+/g, ' ').trim();
    const content = rawText.slice(0, 3000); // Limit for LLM input

    const prompt = `Summarize the following web page in 1–2 clear sentences, followed by 5 key bullet points.\n\n${content}`;


    const openRouterRes = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: "mistralai/mistral-small-3.2-24b-instruct:free",
        messages: [{ role: "user", content: prompt }]
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://your-site-url.com',
          'X-Title': 'URL Summarizer'
        }
      }
    );

    const output = openRouterRes.data.choices?.[0]?.message?.content || 'No summary found';
    const fullText = output.trim();

    // Smart fallback if response is generic/help-style
    if (/need to see|please provide|you can use/i.test(fullText)) {
      return res.json({
        summary: 'Summary not available — content may be blocked or unsupported.',
        points: []
      });
    }

    // Extract summary
    const splitText = fullText.split('\n').map(l => l.trim()).filter(Boolean);
const summary = splitText[0] || 'Summary not found';

    // Extract bullet/numbered points
    const pointMatches = [...fullText.matchAll(/^\s*(?:[-*]|\d+\.)\s+(.*)/gm)];
    const points = pointMatches.map(m => m[1].trim()).slice(0, 5);

    res.json({ summary, points });
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

app.listen(3000, () => console.log('Server running on http://localhost:3000'));
