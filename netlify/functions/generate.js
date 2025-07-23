const OpenAI = require('openai');

// Initialize the OpenAI client with the API key from Netlify's environment variables
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

exports.handler = async function (event, context) {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  // Get the user's inputs from the front-end
  const { topic, goal, tone, audience } = JSON.parse(event.body);

  if (!topic) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Topic is required' }) };
  }

  // This is the "Master Prompt" that instructs the AI
  const prompt = `
    You are "Blueprint AI", a world-class viral video strategist. Your goal is to create a complete "Viral Video Blueprint" for the user.
    The user's inputs are:
    - Video Topic: "${topic}"
    - Primary Goal: "${goal || 'Go Viral'}"
    - Desired Tone: "${tone || 'Engaging'}"
    - Target Audience: "${audience || 'A general audience'}"

    Generate a comprehensive blueprint. The entire response must be a single, valid JSON object with three top-level keys: "hooks", "script", and "production_plan".

    1.  **hooks**: An array of exactly 5 hooks. Each hook in the array must be an object with FOUR keys:
        - "category": The strategic category of the hook. Must be one of: "Curiosity Gap", "Controversy", "Urgency (FOMO)", or "Direct Value".
        - "text": The hook text (string, max 15 words).
        - "score": A "Viral Score" (integer, 70-100) predicting its viral potential.
        - "analysis": A brief, one-sentence explanation of why the hook works based on its category (string).

    2.  **script**: A full 30-second video script (string). It MUST include "Delivery Coach" notes in parentheses, like "(Say this line quickly and with energy)". The script should be formatted with newlines (\\n) for readability.

    3.  **production_plan**: An object with three keys:
        - "visuals": An array of 3-4 specific, shot-by-shot visual ideas (array of strings).
        - "audio": A suggestion for the type of trending audio to use (string).
        - "hashtags": An array of 5-7 strategic hashtags (array of strings).
  `;

  try {
    // Call the OpenAI API with the gpt-4o model
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // Using the latest and best model
      messages: [
        {
          "role": "system",
          "content": "You are a helpful assistant designed to output JSON."
        },
        {
          "role": "user",
          "content": prompt
        }
      ],
      response_format: { type: "json_object" }, // This ensures the output is always valid JSON
    });

    // Return the AI's response to the front-end
    return {
      statusCode: 200,
      body: response.choices[0].message.content,
    };

  } catch (error) {
    console.error("OpenAI API Error:", error);
    return { statusCode: 500, body: JSON.stringify({ error: 'Failed to generate content from AI.' }) };
  }
};
