exports.handler = async function (event, context) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const { topic } = JSON.parse(event.body);
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

  if (!topic) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Topic is required' }) };
  }
  if (!GEMINI_API_KEY) {
    return { statusCode: 500, body: JSON.stringify({ error: 'API Key is not configured' }) };
  }

  const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;
  
  const prompt = `
    You are "Blueprint AI", a world-class viral video strategist. Your goal is to create a complete "Viral Video Blueprint" for the user's topic: "${topic}".

    Generate a comprehensive blueprint as a single, valid JSON object. The JSON object must have three top-level keys: "hooks", "script", and "production_plan".

    1.  **hooks**: An array of exactly 5 hooks. Each hook in the array must be an object with three keys:
        - "text": The hook text (string, max 15 words).
        - "score": A "Viral Score" (integer, 70-100) predicting its viral potential.
        - "analysis": A brief, one-sentence explanation of why the hook works (string).

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
