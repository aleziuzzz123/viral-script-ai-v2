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
    
    // --- NEW, MORE POWERFUL PROMPT ---
    const prompt = `
      You are a world-class viral video strategist for platforms like TikTok, YouTube Shorts, and Instagram Reels.
      Analyze these sequential video frames and provide a "Viral Video Deep Dive".

      Your analysis must be brutally honest but constructive, focusing on actionable advice.
      
      Return your analysis strictly in a JSON object with the following structure:
      {
        "virality_score": number, // The overall score from 0-100.
        "key_metrics": {
          "hook_strength": number, // Score 0-10 for the first 3 seconds' ability to grab attention.
          "visual_clarity": number, // Score 0-10 for how clear and high-quality the visuals are.
          "engagement_potential": number // Score 0-10 for the likelihood of generating comments and shares.
        },
        "analysis_summary": string, // A 1-2 sentence summary of your overall findings.
        "detailed_breakdown": [
          {
            "area": string, // e.g., "The Hook (First 3 Seconds)", "Visual Storytelling", "Pacing & Editing"
            "feedback": string, // Detailed, constructive feedback for this area.
            "suggestion": string // A specific, actionable improvement for this area.
          }
        ],
        "creative_suggestions": {
          "alternative_hooks": [string], // An array of 2-3 specific, ready-to-use alternative hook ideas.
          "thumbnail_text": string, // A compelling text overlay suggestion for the first frame/thumbnail.
          "audio_suggestion": string // A suggestion for the *type* of trending audio that would fit the video's mood.
        }
      }
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
      max_tokens: 2048, // Increased tokens for more detailed analysis
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
