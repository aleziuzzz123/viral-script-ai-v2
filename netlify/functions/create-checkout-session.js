const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const { priceId, userId } = JSON.parse(event.body);

  if (!priceId || !userId) {
    return { statusCode: 400, body: 'Missing priceId or userId' };
  }

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price: priceId,
        quantity: 1,
      }],
      mode: 'payment',
      // IMPORTANT: Replace with your actual Netlify URL
      success_url: `https://dancing-mooncake-c15ec6.netlify.app/?payment=success`,
      cancel_url: `https://dancing-mooncake-c15ec6.netlify.app/?payment=cancelled`,
      // We pass the Supabase user ID here so we know who to give credits to later
      client_reference_id: userId,
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ sessionId: session.id, url: session.url }),
    };
  } catch (error) {
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};
