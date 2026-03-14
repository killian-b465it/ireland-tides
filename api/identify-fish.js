module.exports = async function handler(req, res) {
    // Only allow POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const apiKey = process.env.GROQ_API_KEY;
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
        const dataUrl = `data:${mimeType};base64,${base64Data}`;

        // Using Groq's Llama 3.2 Vision model (free tier)
        const groqUrl = 'https://api.groq.com/openai/v1/chat/completions';

        const groqResponse = await fetch(groqUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'llama-3.2-11b-vision-preview',
                messages: [
                    {
                        role: 'user',
                        content: [
                            {
                                type: 'text',
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
                                type: 'image_url',
                                image_url: {
                                    url: dataUrl
                                }
                            }
                        ]
                    }
                ],
                temperature: 0.1,
                max_tokens: 500
            })
        });

        if (!groqResponse.ok) {
            const errText = await groqResponse.text();
            console.error('Groq API error:', groqResponse.status, errText);
            if (groqResponse.status === 429) {
                return res.status(429).json({ error: 'AI is busy, please try again in a few seconds' });
            }
            return res.status(502).json({ error: `AI service error: ${errText}` });
        }

        const groqData = await groqResponse.json();
        const textContent = groqData.choices?.[0]?.message?.content;

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
