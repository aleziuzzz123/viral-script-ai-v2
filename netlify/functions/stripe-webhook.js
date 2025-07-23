const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

// This maps your Stripe Price IDs to the number of credits
const creditsMap = {
  'price_1RnqtMKucnJQ8ZaNjFzxoW85': 10,  // Trial Pack
  'price_1RnqtrKucnJQ8ZaNI5apjA4u': 50,  // Creator Pack
  'price_1RnquFKucnJQ8ZaNR9Z6skUk': 110, // Pro Pack (100 + 10 bonus)
  'price_1RnqucKucnJQ8ZaNt9SNptof': 300, // Agency Pack (250 + 50 bonus)
};

exports.handler = async ({ body, headers }) => {
  try {
    const stripeEvent = stripe.webhooks.constructEvent(
      body,
      headers['stripe-signature'],
      process.env.STRIPE_WEBHOOK_SECRET
    );

    if (stripeEvent.type === 'checkout.session.completed') {
      const session = stripeEvent.data.object;
      const userId = session.client_reference_id;
      const priceId = session.display_items[0].price.id;
      const creditsToAdd = creditsMap[priceId];

      if (userId && creditsToAdd) {
        // 1. Fetch the user's current credits
        const { data: profile, error: fetchError } = await supabase
          .from('profiles')
          .select('credits')
          .eq('id', userId)
          .single();

        if (fetchError) throw fetchError;

        // 2. Calculate new credit balance and update the user's profile
        const newCredits = profile.credits + creditsToAdd;
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ credits: newCredits })
          .eq('id', userId);

        if (updateError) throw updateError;
      }
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ received: true }),
    };
  } catch (err) {
    return {
      statusCode: 400,
      body: `Webhook Error: ${err.message}`,
    };
  }
};
