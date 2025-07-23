const OpenAI = require('openai');
const { createClient } = require('@supabase/supabase-js');

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Initialize Supabase Admin Client
// We use the SERVICE_ROLE_KEY for backend functions to bypass RLS policies
const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL, 
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

exports.handler = async function (event, context) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const { topic, goal, tone, audience, userId } = JSON.parse(event.body);

  if (!topic || !userId) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Topic and userId are required' }) };
  }

  const prompt = `
    You are "Blueprint AI", a world-class viral video strategist...
    // The rest of your master prompt remains the same
  `;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "system", content: "You are a helpful assistant designed to output JSON." }, { role: "user", content: prompt }],
      response_format: { type: "json_object" },
    });

    const blueprint = JSON.parse(response.choices[0].message.content);

    // --- NEW: Save the generation to the database ---
    await supabase.from('generations').insert({
      user_id: userId,
      topic: topic,
      blueprint: blueprint,
    });
    // ---------------------------------------------

    return {
      statusCode: 200,
      body: JSON.stringify(blueprint),
    };

  } catch (error) {
    console.error("API or DB Error:", error);
    return { statusCode: 500, body: JSON.stringify({ error: 'Failed to generate or save content.' }) };
  }
};
