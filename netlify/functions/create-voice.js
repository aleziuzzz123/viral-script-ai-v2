// File: netlify/functions/create-voice.js
const Busboy = require('busboy');

// Helper to parse multipart form data
function parseMultipartForm(event) {
    return new Promise((resolve) => {
        const fields = {};
        let fileData = {};

        const busboy = Busboy({
            headers: {
                'content-type': event.headers['content-type'] || event.headers['Content-Type'],
            },
        });

        busboy.on('file', (fieldname, file, filename, encoding, mimetype) => {
            const chunks = [];
            file.on('data', (chunk) => chunks.push(chunk));
            file.on('end', () => {
                fileData = {
                    content: Buffer.concat(chunks),
                    filename: filename.filename,
                    contentType: filename.mimeType,
                };
            });
        });

        busboy.on('field', (fieldname, val) => {
            fields[fieldname] = val;
        });

        busboy.on('finish', () => {
            resolve({ fields, fileData });
        });

        busboy.end(Buffer.from(event.body, 'base64'));
    });
}


exports.handler = async function (event, context) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
  if (!ELEVENLABS_API_KEY) {
    return { statusCode: 500, body: JSON.stringify({ error: 'ElevenLabs API Key is not configured' }) };
  }

  try {
    const { fields, fileData } = await parseMultipartForm(event);
    
    const formData = new FormData();
    formData.append('name', `UserVoice_${fields.userId || 'unknown'}`);
    formData.append('files', new Blob([fileData.content], { type: fileData.contentType }), fileData.filename);

    const response = await fetch('https://api.elevenlabs.io/v1/voices/add', {
      method: 'POST',
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error("ElevenLabs API Error:", errorBody);
      return { statusCode: response.status, body: JSON.stringify({ error: `API Error: ${errorBody}` }) };
    }

    const result = await response.json();
    return {
      statusCode: 200,
      body: JSON.stringify({ voice_id: result.voice_id }),
    };

  } catch (error) {
    console.error("Serverless function error:", error);
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};