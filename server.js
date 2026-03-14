require('dotenv').config();
const express = require('express');
const nodemailer = require('nodemailer');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Secure Stripe server running on port ${PORT}`));
