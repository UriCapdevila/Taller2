// Netlify Function: get-dataset
// Serves as an authenticated proxy between the Frontend and Google Drive.

import { google } from 'googleapis';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export const handler = async (event) => {
  // Handle CORS preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: '',
    };
  }

  // Task 2.2: Validate `id` query parameter
  const rawId = event.queryStringParameters?.id;
  const parsedId = parseInt(rawId, 10);

  const isValidId =
    rawId !== undefined &&
    rawId !== null &&
    !isNaN(parsedId) &&
    parsedId >= 1 &&
    parsedId <= 4 &&
    String(parsedId) === String(rawId).trim();

  if (!isValidId) {
    return {
      statusCode: 400,
      headers: {
        ...CORS_HEADERS,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ error: 'Invalid id parameter. Must be an integer between 1 and 4.' }),
    };
  }

  const id = parsedId;

  // Task 2.4: Authenticate with Google Drive API
  let serviceAccountCredentials;
  try {
    serviceAccountCredentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
  } catch {
    return {
      statusCode: 500,
      headers: {
        ...CORS_HEADERS,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ error: 'Internal server error.' }),
    };
  }

  let authClient;
  try {
    const auth = new google.auth.GoogleAuth({
      credentials: serviceAccountCredentials,
      scopes: ['https://www.googleapis.com/auth/drive.readonly'],
    });
    authClient = await auth.getClient();
  } catch {
    return {
      statusCode: 500,
      headers: {
        ...CORS_HEADERS,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ error: 'Internal server error.' }),
    };
  }

  const drive = google.drive({ version: 'v3', auth: authClient });

  // Task 2.5: List files in the folder to find the artifact
  let listResponse;
  try {
    listResponse = await drive.files.list({
      q: `'${process.env.GOOGLE_DRIVE_FOLDER_ID}' in parents and name = 'artifact_${id}.json' and trashed = false`,
      fields: 'files(id, name)',
      spaces: 'drive',
    });
  } catch {
    return {
      statusCode: 500,
      headers: {
        ...CORS_HEADERS,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ error: 'Internal server error.' }),
    };
  }

  // Task 2.5: Check if file exists
  if (listResponse.data.files.length === 0) {
    return {
      statusCode: 404,
      headers: {
        ...CORS_HEADERS,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ error: `Artifact not found for dataset id ${id}.` }),
    };
  }

  // Task 2.5: Download the file content
  let fileResponse;
  try {
    const fileId = listResponse.data.files[0].id;
    fileResponse = await drive.files.get(
      { fileId, alt: 'media' },
      { responseType: 'json' }
    );
  } catch {
    return {
      statusCode: 500,
      headers: {
        ...CORS_HEADERS,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ error: 'Internal server error.' }),
    };
  }

  // Task 2.5: Return the artifact
  return {
    statusCode: 200,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    body: JSON.stringify(fileResponse.data),
  };
};
