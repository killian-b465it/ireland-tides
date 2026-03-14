module.exports = async function handler(req, res) {
    // Only allow POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        return res.status(503).json({ error: 'API key not configured' });
    }

    try {
        const { image } = req.body;
        if (!image) {
            return res.status(400).json({ error: 'No image provided' });
        }

        // Extract base64 data
        const base64Match = image.match(/^data:image\/([\w+]+);base64,(.+)$/);
        if (!base64Match) {
            return res.status(400).json({ error: 'Invalid image format' });
        }

        const mimeType = `image/${base64Match[1]}`;
        const base64Data = base64Match[2];

        // Using gemini-2.0-flash-lite - highest free tier limit (30 req/min)
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${apiKey}`;

        const geminiResponse = await fetch(geminiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [
                        {
                            text: `You are an expert marine biologist and fish identification specialist. Analyse this image and identify any fish or marine species shown.

Respond ONLY with valid JSON in this exact format (no markdown, no code blocks, no extra text):
{
  "name": "Common name of the species",
  "scientific": "Scientific/Latin name",
  "confidence": 0.85,
  "habitat": "Where this species is typically found",
  "size": "Typical size range",
  "description": "Brief 1-2 sentence description",
  "edible": true,
  "conservation": "Conservation status if notable"
}

If you cannot identify a fish in the image, still try your best guess and give a lower confidence score.`
                        },
                        {
                            inlineData: { mimeType, data: base64Data }
                        }
                    ]
                }]
            })
        });

        if (!geminiResponse.ok) {
            const errText = await geminiResponse.text();
            console.error('Gemini error:', geminiResponse.status, errText);
            if (geminiResponse.status === 429) {
                return res.status(429).json({ error: 'AI is busy, please try again in a few seconds' });
            }
            return res.status(502).json({ error: 'AI service error' });
        }

        const geminiData = await geminiResponse.json();
        const textContent = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!textContent) {
            return res.status(502).json({ error: 'No AI response' });
        }

        // Parse JSON response
        let cleanJson = textContent.trim();
        if (cleanJson.startsWith('```')) {
            cleanJson = cleanJson.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
        }

        const result = JSON.parse(cleanJson);
        return res.status(200).json(result);

    } catch (error) {
        console.error('Identify fish error:', error);
        return res.status(500).json({ error: 'Failed to identify species' });
    }
};
