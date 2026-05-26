require('dotenv').config();
const express = require('express');
const nodemailer = require('nodemailer');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static('www'));

// Set up Nodemailer transporter
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'irishfishinghub@gmail.com',
        pass: process.env.EMAIL_PASS // Secure App Password from .env
    }
});

// Create a Checkout Session
// In a real app, you would get the priceId from your Stripe Dashboard
// and pass it here or hardcode it.
app.post('/create-checkout-session', async (req, res) => {
    try {
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
                {
                    price_data: {
                        currency: 'eur',
                        product_data: {
                            name: 'Irish Fishing Hub Pro Membership',
                            description: 'Access to community features, detailed coordinates, and pro insights.',
                        },
                        unit_amount: 1000, // €10.00 in cents
                        recurring: {
                            interval: 'month',
                        },
                    },
                    quantity: 1,
                },
            ],
            mode: 'subscription',
            success_url: process.env.SUCCESS_URL,
            cancel_url: process.env.CANCEL_URL,
        });

        res.json({ url: session.url });
    } catch (error) {
        console.error('Error creating checkout session:', error);
        res.status(500).json({ error: error.message });
    }
});

// Create a Customer Portal Session
app.post('/create-portal-session', async (req, res) => {
    try {
        const { email } = req.body;

        // In a real app, you would look up the stripeCustomerId from your database
        // For this demo, we'll search for the customer by email
        const customers = await stripe.customers.list({ email, limit: 1 });

        if (customers.data.length === 0) {
            return res.status(404).json({ error: 'Customer not found' });
        }

        const session = await stripe.billingPortal.sessions.create({
            customer: customers.data[0].id,
            return_url: process.env.SUCCESS_URL, // Return to app
        });

        res.json({ url: session.url });
    } catch (error) {
        console.error('Error creating portal session:', error);
        res.status(500).json({ error: error.message });
    }
});

// Broadcast Email endpoint
app.post('/send-broadcast-email', async (req, res) => {
    try {
        const { to, subject, body } = req.body;

        if (!to || !subject || !body) {
            return res.status(400).json({ error: 'Missing required fields: to, subject, or body' });
        }

        const mailOptions = {
            from: '"Irish Fishing Hub" <irishfishinghub@gmail.com>',
            to: to, // Can be a single email or a comma-separated list
            subject: subject,
            text: body,
            html: body.replace(/\n/g, '<br>') // Basic text-to-html conversion
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent: ' + info.response);
        res.json({ success: true, messageId: info.messageId });
    } catch (error) {
        console.error('Error sending email:', error);
        res.status(500).json({ error: 'Failed to send email: ' + error.message });
    }
});

// ============================================
// AI Fish Identification via Google Gemini
// ============================================
app.post('/api/identify-fish', async (req, res) => {
    try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return res.status(503).json({ error: 'Gemini API key not configured. Add GEMINI_API_KEY to your .env file.' });
        }

        const { image } = req.body;
        if (!image) {
            return res.status(400).json({ error: 'No image provided' });
        }

        // Extract base64 data from data URL
        const base64Match = image.match(/^data:image\/(\w+);base64,(.+)$/);
        if (!base64Match) {
            return res.status(400).json({ error: 'Invalid image format. Expected base64 data URL.' });
        }

        const mimeType = `image/${base64Match[1]}`;
        const base64Data = base64Match[2];

        // Call Gemini Vision API
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

        const geminiResponse = await fetch(geminiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [
                        {
                            text: `You are an expert marine biologist specialising in Irish and European fish species. Analyse this image and identify the fish or marine species shown.

Respond ONLY with valid JSON in this exact format (no markdown, no code blocks):
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

If you cannot identify a fish in the image, respond with:
{"name": "Unknown", "scientific": "", "confidence": 0.0, "description": "Could not identify a fish species in this image. Please try a clearer photo showing the full fish."}`
                        },
                        {
                            inlineData: {
                                mimeType: mimeType,
                                data: base64Data
                            }
                        }
                    ]
                }]
            })
        });

        if (!geminiResponse.ok) {
            const errorText = await geminiResponse.text();
            console.error('Gemini API error:', errorText);
            return res.status(502).json({ error: 'AI service temporarily unavailable' });
        }

        const geminiData = await geminiResponse.json();

        // Extract the text response
        const textContent = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!textContent) {
            return res.status(502).json({ error: 'No response from AI service' });
        }

        // Parse the JSON response (handle markdown code blocks if present)
        let cleanJson = textContent.trim();
        if (cleanJson.startsWith('```')) {
            cleanJson = cleanJson.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
        }

        const result = JSON.parse(cleanJson);
        res.json(result);

    } catch (error) {
        console.error('Fish identification error:', error);
        res.status(500).json({ error: 'Failed to identify fish species' });
    }
});

// ============================================
// Weather Proxy — uses wttr.in (avoids client-side network/CORS issues)
// Response is transformed to match Open-Meteo format so the front-end
// displayWeatherData() function needs zero changes.
// ============================================
app.get('/api/weather', async (req, res) => {
    try {
        const { lat, lon } = req.query;
        if (!lat || !lon) return res.status(400).json({ error: 'lat and lon required' });

        // wttr.in supports lat,lon directly — no API key needed
        const url = `https://wttr.in/${lat},${lon}?format=j1`;
        const response = await fetch(url, { headers: { 'User-Agent': 'IrishFishingHub/3.0' } });
        if (!response.ok) throw new Error(`wttr.in responded ${response.status}`);
        const wttr = await response.json();

        // --- Map wttr.in weather codes to Open-Meteo WMO codes ---
        const wttrToWmo = {
            113:0, 116:2, 119:3, 122:3, 143:45, 176:61, 179:71, 182:66,
            185:56, 200:95, 227:75, 230:75, 248:45, 260:48, 263:51, 266:51,
            281:56, 284:57, 293:61, 296:61, 299:63, 302:63, 305:65, 308:65,
            311:66, 314:67, 317:66, 320:67, 323:71, 326:71, 329:73, 332:73,
            335:75, 338:75, 350:77, 353:80, 356:81, 359:82, 362:85, 365:85,
            368:85, 371:86, 374:85, 377:86, 386:95, 389:95, 392:95, 395:95
        };
        const mapCode = c => wttrToWmo[parseInt(c)] ?? 0;

        // Parse wttr.in sunrise/sunset "07:30 AM" → ISO datetime prefix
        const parseTime = (dateStr, timeStr) => {
            const match = timeStr.trim().match(/(\d+):(\d+)\s*(AM|PM)/i);
            if (!match) return `${dateStr}T06:00`;
            let h = parseInt(match[1]), m = parseInt(match[2]);
            const pm = match[3].toUpperCase() === 'PM';
            if (pm && h !== 12) h += 12;
            if (!pm && h === 12) h = 0;
            return `${dateStr}T${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
        };

        const cur = wttr.current_condition[0];
        const days = wttr.weather; // up to 3 days from wttr.in

        // Build Open-Meteo–compatible response
        const data = {
            current: {
                temperature_2m:       parseFloat(cur.temp_C),
                apparent_temperature: parseFloat(cur.FeelsLikeC),
                weather_code:         mapCode(cur.weatherCode),
                wind_speed_10m:       parseFloat(cur.windspeedKmph),
                wind_direction_10m:   parseFloat(cur.winddirDegree),
                relative_humidity_2m: parseFloat(cur.humidity)
            },
            daily: {
                weather_code:       days.map(d => mapCode(d.hourly[4]?.weatherCode ?? 113)),
                temperature_2m_max: days.map(d => parseFloat(d.maxtempC)),
                temperature_2m_min: days.map(d => parseFloat(d.mintempC)),
                sunrise:            days.map(d => parseTime(d.date, d.astronomy[0].sunrise)),
                sunset:             days.map(d => parseTime(d.date, d.astronomy[0].sunset))
            }
        };

        res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
        res.json(data);
    } catch (error) {
        console.error('Weather proxy error:', error.message);
        res.status(502).json({ error: 'Weather data unavailable' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Secure Stripe server running on port ${PORT}`));
