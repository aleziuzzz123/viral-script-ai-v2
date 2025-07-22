exports.handler = async function (event, context) {
  // Only allow POST requests
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
  
  // --- NEW, UPGRADED "SECRET SAUCE" PROMPT ---
  const prompt = `
    You are "ViralVerse", a world-class social media growth strategist and scriptwriter specializing in short-form video for TikTok, YouTube Shorts, and Instagram Reels. You have a deep understanding of audience psychology, platform algorithms, and what makes content go viral. Your goal is to create a complete, ready-to-film video blueprint that is strategically designed for maximum engagement and virality.
    
    The user's video topic is: "${topic}".

    Generate the following content based on the user's topic. Your entire response must be in a single, valid JSON object.

    The JSON object must have two keys:
    1. "hooks": An array of exactly 10 unique, compelling video hooks. Each hook must be based on a different proven viral formula (e.g., The Mistake Hook, The Secret Hook, The "Us vs. Them" Hook, The Curiosity Hook). Each hook must be a string and no more than 15 words.
    2. "script": A detailed, high-impact 30-second video script based on the most powerful hook. The script must be a single string and follow the AIDA (Attention, Interest, Desire, Action) framework. It must include specific production notes.

    The script string must follow this exact format:
    "**Hook (Attention):** [Your chosen hook]\\n\\n**Visual 1 (Interest):** [Describe a compelling visual scene or talking point that builds interest and explains the problem.]\\n\\n**Text Overlay 1:** [Suggest on-screen text for Visual 1.]\\n\\n**Visual 2 (Desire):** [Describe a visual scene or talking point that showcases the solution or the desired outcome.]\\n\\n**Text Overlay 2:** [Suggest on-screen text for Visual 2.]\\n\\n**Call to Action (Action):** [A strong, clear call to action that tells the viewer exactly what to do next.]\\n\\n**Production Notes:** [Suggest a style of trending audio (e.g., 'upbeat instructional audio') and a simple editing tip (e.g., 'Use quick cuts between visuals').]"
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
