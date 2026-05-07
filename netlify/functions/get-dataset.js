// Netlify Function: get-dataset
// Authenticated proxy between the Frontend and Google Drive.
//
// Cache strategy — in-memory cache with Drive modifiedTime invalidation:
//   - On every request, fetch only the file metadata (modifiedTime) from Drive.
//     This is a single lightweight API call (~50ms) instead of downloading the
//     full artifact (~1–5 MB).
//   - If modifiedTime matches the cached entry → return cached artifact immediately.
//   - If modifiedTime changed (Colab re-ran and re-uploaded) → download the new
//     artifact, update the cache, and return the fresh data.
//   - Netlify reuses warm function instances between requests, so the in-memory
//     cache persists across invocations at zero extra cost.
//
// Result: first request per dataset downloads from Drive; subsequent requests
// are served from memory unless the Colab pipeline has produced a new version.

import { google } from 'googleapis';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

/**
 * In-memory cache — lives for the lifetime of the warm function instance.
 * Structure: Map<datasetId, { fileId, modifiedTime, artifact }>
 */
const artifactCache = new Map();

/**
 * Build and return an authenticated Google Drive client.
 * Parses the service account JSON from the environment variable once per call.
 */
async function getDriveClient() {
  const serviceAccountCredentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
  const auth = new google.auth.GoogleAuth({
    credentials: serviceAccountCredentials,
    scopes: ['https://www.googleapis.com/auth/drive.readonly'],
  });
  const authClient = await auth.getClient();
  return google.drive({ version: 'v3', auth: authClient });
}

export const handler = async (event) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: CORS_HEADERS, body: '' };
  }

  // ── Validate `id` parameter ──────────────────────────────────────────────
  const rawId   = event.queryStringParameters?.id;
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
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Invalid id parameter. Must be an integer between 1 and 4.' }),
    };
  }

  const id = parsedId;

  // ── Authenticate ─────────────────────────────────────────────────────────
  let drive;
  try {
    drive = await getDriveClient();
  } catch {
    return {
      statusCode: 500,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Internal server error.' }),
    };
  }

  // ── Fetch file metadata (lightweight — only id + modifiedTime) ───────────
  let fileId, modifiedTime;
  try {
    const listResponse = await drive.files.list({
      q: `'${process.env.GOOGLE_DRIVE_FOLDER_ID}' in parents and name = 'artifact_${id}.json' and trashed = false`,
      fields: 'files(id, modifiedTime)',
      spaces: 'drive',
    });

    if (listResponse.data.files.length === 0) {
      return {
        statusCode: 404,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: `Artifact not found for dataset id ${id}.` }),
      };
    }

    fileId       = listResponse.data.files[0].id;
    modifiedTime = listResponse.data.files[0].modifiedTime;
  } catch {
    return {
      statusCode: 500,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Internal server error.' }),
    };
  }

  // ── Cache hit: modifiedTime unchanged → return cached artifact ───────────
  const cached = artifactCache.get(id);
  if (cached && cached.modifiedTime === modifiedTime) {
    return {
      statusCode: 200,
      headers: {
        ...CORS_HEADERS,
        'Content-Type': 'application/json',
        'X-Cache': 'HIT',                  // useful for debugging in DevTools
        'X-Cache-Modified': modifiedTime,
      },
      body: cached.body,                   // already-serialized JSON string
    };
  }

  // ── Cache miss or stale: download the full artifact from Drive ───────────
  let artifactBody;
  try {
    const fileResponse = await drive.files.get(
      { fileId, alt: 'media' },
      { responseType: 'json' }
    );
    artifactBody = JSON.stringify(fileResponse.data);
  } catch {
    return {
      statusCode: 500,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Internal server error.' }),
    };
  }

  // ── Update cache ─────────────────────────────────────────────────────────
  artifactCache.set(id, { fileId, modifiedTime, body: artifactBody });

  return {
    statusCode: 200,
    headers: {
      ...CORS_HEADERS,
      'Content-Type': 'application/json',
      'X-Cache': cached ? 'STALE' : 'MISS', // MISS = first load, STALE = Colab updated
      'X-Cache-Modified': modifiedTime,
    },
    body: artifactBody,
  };
};
