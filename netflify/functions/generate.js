exports.handler = async function (event, context) {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

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