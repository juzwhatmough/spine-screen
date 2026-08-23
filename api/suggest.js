// Vercel serverless function.
// Keeps the Anthropic API key on the server — never exposed to the browser.
// Requires an ANTHROPIC_API_KEY environment variable set in the Vercel project.

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: 'Server is missing ANTHROPIC_API_KEY. Add it in Vercel > Project Settings > Environment Variables.' });
    return;
  }

  const { prompt } = req.body || {};
  if (!prompt || typeof prompt !== 'string') {
    res.status(400).json({ error: 'Missing prompt' });
    return;
  }

  try {
    const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1000,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    const data = await anthropicRes.json();

    if (!anthropicRes.ok) {
      res.status(anthropicRes.status).json({ error: data?.error?.message || 'Anthropic API error' });
      return;
    }

    const textBlocks = (data.content || [])
      .filter((c) => c.type === 'text')
      .map((c) => c.text)
      .join('\n');
    const clean = textBlocks.replace(/```json|```/g, '').trim();

    let items;
    try {
      items = JSON.parse(clean);
    } catch (e) {
      res.status(502).json({ error: 'Could not parse the model response' });
      return;
    }

    res.status(200).json({ items });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Server error' });
  }
};
