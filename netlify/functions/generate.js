const OpenAI = require('openai');
const { createClient } = require('@supabase/supabase-js');

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Initialize Supabase Admin Client
const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL, 
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

exports.handler = async function (event, context) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  // Now accepts the new userId from the front-end
  const { topic, goal, tone, audience, userId } = JSON.parse(event.body);

  if (!topic || !userId) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Topic and userId are required' }) };
  }

  const prompt = `
    You are "Blueprint AI", a world-class viral video strategist. Your goal is to create a complete "Viral Video Blueprint" for the user.
    The user's inputs are:
    - Video Topic: "${topic}"
    - Primary Goal: "${goal || 'Go Viral'}"
    - Desired Tone: "${tone || 'Engaging'}"
    - Target Audience: "${audience || 'A general audience'}"

    Generate a comprehensive blueprint as a single, valid JSON object with three top-level keys: "hooks", "script", and "production_plan".

    1.  hooks: An array of exactly 5 hooks. Each hook must be an object with FOUR keys:
        - "category": The strategic category of the hook. Must be one of: "Curiosity Gap", "Controversy", "Urgency (FOMO)", or "Direct Value".
        - "text": The hook text (string, max 15 words).
        - "score": A "Viral Score" (integer, 70-100) predicting its viral potential.
        - "analysis": A brief, one-sentence explanation of why the hook works based on its category (string).

    2.  script: A full 30-second video script (string). It MUST include "Delivery Coach" notes in parentheses. The script should be formatted with newlines (\\n) for readability.

    3.  production_plan: An object with three keys:
        - "visuals": An array of 3-4 specific, shot-by-shot visual ideas (array of strings).
        - "audio": A suggestion for the type of trending audio to use (string).
        - "hashtags": An array of 5-7 strategic hashtags (array of strings).
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

    return {
      statusCode: 200,
      body: JSON.stringify(blueprint),
    };

  } catch (error) {
    console.error("API or DB Error:", error);
    return { statusCode: 500, body: JSON.stringify({ error: 'Failed to generate or save content.' }) };
  }
};
