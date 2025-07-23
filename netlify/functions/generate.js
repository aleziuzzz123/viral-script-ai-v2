<<<<<<< HEAD
exports.handler = async function (event, context) {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }
=======
exports.handler = async function (event, context) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }
>>>>>>> 531facc729c5570744c64f848b2861fd1ebe603a

<<<<<<< HEAD
  const { topic } = JSON.parse(event.body);
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY; // Note the name change

  if (!topic) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Topic is required' }) };
  }
  if (!GEMINI_API_KEY) {
    return { statusCode: 500, body: JSON.stringify({ error: 'API Key is not configured' }) };
  }

  const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;
  
  const prompt = `
    You are an expert viral video scriptwriter for short-form platforms like TikTok, YouTube Shorts, and Instagram Reels.
    Your goal is to create content that is highly engaging and has a high potential for virality.
    The user's video topic is: "${topic}".

    Generate the following content based on the user's topic. Your entire response must be in a single, valid JSON object.

    The JSON object must have two keys:
    1. "hooks": An array of exactly 10 unique, compelling video hooks. Each hook should be a string and no more than 15 words. They should be attention-grabbing and create curiosity.
    2. "script": A detailed 30-second video script based on the most powerful hook. The script should be a single string and include three parts:
        - The Hook: Start with the chosen hook.
        - The Body: Provide 3-4 talking points or visual scenes.
        - The Call to Action (CTA): End with a strong call to action.

    Example format for the script string:
    "**Hook:** [Your chosen hook]\\n\\n**Scene 1:** [Description of the first visual or talking point]\\n\\n**Scene 2:** [Description of the second visual or talking point]\\n\\n**Scene 3:** [Description of the third visual or talking point]\\n\\n**CTA:** [Your call to action]"
  `;

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      return { statusCode: response.status, body: JSON.stringify({ error: `API Error: ${errorBody}` }) };
    }

    const data = await response.json();
    
    if (data.candidates && data.candidates.length > 0) {
        const rawText = data.candidates[0].content.parts[0].text;
        const cleanedText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
        return {
            statusCode: 200,
            body: cleanedText,
        };
    } else {
        return { statusCode: 500, body: JSON.stringify({ error: 'No content generated' }) };
    }

  } catch (error) {
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};
=======
  // Now accepts the new wizard inputs
  const { topic, goal, tone, audience } = JSON.parse(event.body);
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

  if (!topic) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Topic is required' }) };
  }
  if (!GEMINI_API_KEY) {
    return { statusCode: 500, body: JSON.stringify({ error: 'API Key is not configured' }) };
  }

  const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;
  
  const prompt = `
    You are "Blueprint AI", a world-class viral video strategist. Your goal is to create a complete "Viral Video Blueprint" for the user.
    The user's inputs are:
    - Video Topic: "${topic}"
    - Primary Goal: "${goal || 'Go Viral'}"
    - Desired Tone: "${tone || 'Engaging'}"
    - Target Audience: "${audience || 'A general audience'}"

    Generate a comprehensive blueprint as a single, valid JSON object. The JSON object must have three top-level keys: "hooks", "script", and "production_plan".

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
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      return { statusCode: response.status, body: JSON.stringify({ error: `API Error: ${errorBody}` }) };
    }

    const data = await response.json();
    
    if (data.candidates && data.candidates.length > 0) {
        const rawText = data.candidates[0].content.parts[0].text;
        const cleanedText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
        return { statusCode: 200, body: cleanedText };
    } else {
        return { statusCode: 500, body: JSON.stringify({ error: 'No content generated' }) };
    }
  } catch (error) {
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};


>>>>>>> 531facc729c5570744c64f848b2861fd1ebe603a