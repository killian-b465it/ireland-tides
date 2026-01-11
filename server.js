require('dotenv').config();
const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Secure Stripe server running on port ${PORT}`));
