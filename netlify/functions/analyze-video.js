// A robust fetch implementation to handle retries and errors.
const fetch = require('node-fetch');

/**
 * Netlify serverless function to analyze video frames for virality.
 * This function receives an array of base64-encoded image frames,
 * sends them to the Google Gemini API for analysis, and returns a
 * structured JSON object with a virality score and improvement suggestions.
 */
exports.handler = async function (event, context) {
  // 1. Validate the incoming request
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  const { GEMINI_API_KEY } = process.env;
  if (!GEMINI_API_KEY) {
    return { statusCode: 500, body: JSON.stringify({ error: 'GEMINI_API_KEY is not configured.' }) };
  }

  try {
    const { frames } = JSON.parse(event.body || '{}');
    if (!frames || !Array.isArray(frames) || frames.length === 0) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Bad Request: "frames" array is missing or empty.' }) };
    }

    // 2. Prepare the request for the Gemini API
    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;
    
    // This prompt is adapted from your AI Studio project to guide the AI's analysis.
    const prompt = `
      Analyze these sequential video frames from a short-form video (e.g., TikTok, Reel, Short).
      My goal is to maximize the video's virality. Based on these frames, provide a comprehensive analysis.

      Evaluate the following key virality factors:
      - **Hook (First 3 seconds):** Is the opening compelling? Does it create immediate curiosity or state a clear value proposition?
      - **Visual Quality & Clarity:** Are the visuals clear and engaging? Is the subject matter easy to understand?
      - **Pacing & Storytelling:** Do the frames suggest a clear story or progression? Does the pacing feel right for a short-form video?
      - **Emotional Impact:** Does the content evoke strong emotions (e.g., humor, surprise, inspiration, controversy)?

      Return your analysis strictly in the provided JSON format. The virality score should be a direct reflection of these factors.
    `;

    // Map the base64 strings to the format the Gemini API expects.
    const imageParts = frames.map(frame => ({
      inline_data: {
        mime_type: 'image/jpeg',
        data: frame,
      },
    }));

    // This schema ensures the AI returns a clean, predictable JSON object.
    const responseSchema = {
      type: 'OBJECT',
      properties: {
        virality_score: {
          type: 'INTEGER',
          description: "A score from 0 to 100 representing the video's likelihood of going viral."
        },
        viral_potential: {
          type: 'STRING',
          enum: ["Low", "Medium", "High"],
          description: "An overall assessment of the video's potential."
        },
        what_works: {
            type: 'ARRAY',
            description: "A list of 2-3 bullet points highlighting the video's strengths.",
            items: { type: 'STRING' }
        },
        improvements: {
          type: 'ARRAY',
          description: "An array of 2-3 concrete suggestions to improve the video's virality.",
          items: { type: 'STRING' }
        }
      },
      required: ["virality_score", "viral_potential", "what_works", "improvements"]
    };

    const requestBody = {
      contents: [{
        parts: [{ text: prompt }, ...imageParts]
      }],
      generation_config: {
        response_mime_type: "application/json",
        response_schema: responseSchema,
        temperature: 0.6,
      }
    };

    // 3. Call the Gemini API
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error('Gemini API Error:', errorBody);
      return { statusCode: response.status, body: JSON.stringify({ error: `AI service failed: ${errorBody}` }) };
    }

    const data = await response.json();

    // 4. Process and return the response
    if (data.candidates && data.candidates.length > 0) {
      const rawText = data.candidates[0].content.parts[0].text;
      const cleanedJson = JSON.parse(rawText);
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
