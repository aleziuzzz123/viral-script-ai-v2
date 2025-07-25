// A robust fetch implementation to handle retries and errors.
const fetch = require('node-fetch');

/**
 * Netlify serverless function to analyze video frames for virality using the OpenAI API.
 * This function receives an array of base64-encoded image frames,
 * sends them to the OpenAI GPT-4o model for analysis, and returns a
 * structured JSON object with a virality score and improvement suggestions.
 */
exports.handler = async function (event, context) {
  // 1. Validate the incoming request
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  // IMPORTANT: This now uses OPENAI_API_KEY
  const { OPENAI_API_KEY } = process.env;
  if (!OPENAI_API_KEY) {
    return { statusCode: 500, body: JSON.stringify({ error: 'OPENAI_API_KEY is not configured.' }) };
  }

  try {
    const { frames } = JSON.parse(event.body || '{}');
    if (!frames || !Array.isArray(frames) || frames.length === 0) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Bad Request: "frames" array is missing or empty.' }) };
    }

    // 2. Prepare the request for the OpenAI API
    const API_URL = 'https://api.openai.com/v1/chat/completions';
    
    // This prompt is adapted for the OpenAI model.
    const prompt = `
      Analyze these sequential video frames from a short-form video (e.g., TikTok, Reel, Short).
      My goal is to maximize the video's virality. Based on these frames, provide a comprehensive analysis.

      Evaluate the following key virality factors:
      - **Hook (First 3 seconds):** Is the opening compelling? Does it create immediate curiosity or state a clear value proposition?
      - **Visual Quality & Clarity:** Are the visuals clear and engaging? Is the subject matter easy to understand?
      - **Pacing & Storytelling:** Do the frames suggest a clear story or progression? Does the pacing feel right for a short-form video?
      - **Emotional Impact:** Does the content evoke strong emotions (e.g., humor, surprise, inspiration, controversy)?

      Return your analysis strictly in a JSON object with the following keys: "virality_score", "viral_potential", "what_works", "improvements".
    `;

    // Map the base64 strings to the format the OpenAI Vision API expects.
    const imageMessages = frames.map(frame => ({
      type: 'image_url',
      image_url: {
        url: `data:image/jpeg;base64,${frame}`,
      },
    }));

    const requestBody = {
      model: "gpt-4o", // Using the latest vision model
      response_format: { "type": "json_object" }, // Enable JSON mode
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            ...imageMessages
          ]
        }
      ],
      max_tokens: 1000,
    };

    // 3. Call the OpenAI API
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error('OpenAI API Error:', errorBody);
      return { statusCode: response.status, body: JSON.stringify({ error: `AI service failed: ${errorBody}` }) };
    }

    const data = await response.json();

    // 4. Process and return the response
    if (data.choices && data.choices.length > 0) {
      const content = data.choices[0].message.content;
      const cleanedJson = JSON.parse(content);
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cleanedJson)
      };
    } else {
      return { statusCode: 500, body: JSON.stringify({ error: 'The AI returned an empty response.' }) };
    }

  } catch (error) {
    console.error('Error in analyze-video function:', error);
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};
