const fetch = require('node-fetch');

exports.handler = async function (event, context) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  const { OPENAI_API_KEY } = process.env;
  if (!OPENAI_API_KEY) {
    return { statusCode: 500, body: JSON.stringify({ error: 'OPENAI_API_KEY is not configured.' }) };
  }

  try {
    const { frames } = JSON.parse(event.body || '{}');
    if (!frames || !Array.isArray(frames) || frames.length === 0) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Bad Request: "frames" array is missing or empty.' }) };
    }

    const API_URL = 'https://api.openai.com/v1/chat/completions';
    
    const prompt = `
      You are a world-class viral video strategist for platforms like TikTok and Instagram Reels.
      Analyze these sequential video frames and provide a "Viral Video Deep Dive" report.
      Your analysis must be brutally honest, insightful, and provide concrete, actionable advice.

      Return your analysis strictly in a JSON object with the following structure:
      {
        "virality_score": number, // The overall score from 0-100.
        "score_summary": string, // A short, punchy summary like "Needs Work", "Good Potential", or "High Potential".
        "score_explanation": string, // A 1-2 sentence explanation for the score.
        "detailed_breakdown": [
          { "metric": "Hook Quality", "rating": "Strong" | "Average" | "Needs Rework", "score": number },
          { "metric": "Pacing & Editing", "rating": "Strong" | "Average" | "Needs Rework", "score": number },
          { "metric": "Audio & Trends", "rating": "Strong" | "Average" | "Needs Rework", "score": number },
          { "metric": "Call to Action", "rating": "Strong" | "Average" | "Needs Rework", "score": number }
        ],
        "what_works": [string], // An array of 2-3 bullet points on the video's strengths.
        "how_to_improve": [
          {
            "point": string, // A specific, actionable improvement suggestion.
            "why_it_matters": string // A brief explanation of why this suggestion is important for virality.
          }
        ]
      }
    `;

    const imageMessages = frames.map(frame => ({
      type: 'image_url',
      image_url: { url: `data:image/jpeg;base64,${frame}` },
    }));

    const requestBody = {
      model: "gpt-4o",
      response_format: { "type": "json_object" },
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            ...imageMessages
          ]
        }
      ],
      max_tokens: 2500,
    };

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
