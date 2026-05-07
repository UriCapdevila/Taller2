// Feature: academic-data-viz — Unit tests for Netlify Function
// Validates: Requirements 2.5, 2.6, 2.7, 2.8

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock googleapis and google-auth-library before importing handler
vi.mock('googleapis', () => {
  const mockGetClient = vi.fn().mockResolvedValue({});
  const mockFilesList = vi.fn();
  const mockFilesGet = vi.fn();

  return {
    google: {
      auth: {
        GoogleAuth: vi.fn().mockImplementation(() => ({
          getClient: mockGetClient,
        })),
      },
      drive: vi.fn().mockReturnValue({
        files: {
          list: mockFilesList,
          get: mockFilesGet,
        },
      }),
    },
    __mockFilesList: mockFilesList,
    __mockFilesGet: mockFilesGet,
  };
});

vi.mock('google-auth-library', () => ({
  GoogleAuth: vi.fn().mockImplementation(() => ({
    getClient: vi.fn().mockResolvedValue({}),
  })),
}));

// Import handler after mocks are set up (Vitest hoists vi.mock calls automatically)
const { handler } = await import('../../netlify/functions/get-dataset.js');
const { google, __mockFilesList, __mockFilesGet } = await import('googleapis');

describe('Unit tests — Netlify Function get-dataset', () => {
  const validServiceAccount = JSON.stringify({
    type: 'service_account',
    project_id: 'mock-project',
    private_key_id: 'mock-key-id',
    private_key: '-----BEGIN RSA PRIVATE KEY-----\nmock-key\n-----END RSA PRIVATE KEY-----\n',
    client_email: 'mock@mock-project.iam.gserviceaccount.com',
    client_id: '123456789',
    auth_uri: 'https://accounts.google.com/o/oauth2/auth',
    token_uri: 'https://oauth2.googleapis.com/token',
  });

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.GOOGLE_SERVICE_ACCOUNT_JSON = validServiceAccount;
    process.env.GOOGLE_DRIVE_FOLDER_ID = 'mock-folder-id';
  });

  afterEach(() => {
    delete process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
    delete process.env.GOOGLE_DRIVE_FOLDER_ID;
  });

  // Test 1: id ausente → HTTP 400
  it('returns HTTP 400 with error body when id is absent', async () => {
    const event = {
      httpMethod: 'GET',
      queryStringParameters: {},
    };

    const response = await handler(event);

    expect(response.statusCode).toBe(400);
    const body = JSON.parse(response.body);
    expect(body).toHaveProperty('error');
  });

  // Test 2: Archivo no encontrado → HTTP 404
  it('returns HTTP 404 with error body when artifact file is not found in Drive', async () => {
    // Drive returns empty file list
    __mockFilesList.mockResolvedValueOnce({
      data: { files: [] },
    });

    google.drive.mockReturnValue({
      files: {
        list: __mockFilesList,
        get: __mockFilesGet,
      },
    });

    const event = {
      httpMethod: 'GET',
      queryStringParameters: { id: '1' },
    };

    const response = await handler(event);

    expect(response.statusCode).toBe(404);
    const body = JSON.parse(response.body);
    expect(body).toHaveProperty('error');
    // Error message should mention "not found" or "Artifact not found"
    expect(body.error.toLowerCase()).toMatch(/not found/);
  });

  // Test 3: Fallo de autenticación → HTTP 500 sin credenciales en body
  it('returns HTTP 500 without exposing credentials when GOOGLE_SERVICE_ACCOUNT_JSON is invalid JSON', async () => {
    const invalidJson = 'invalid-json';
    process.env.GOOGLE_SERVICE_ACCOUNT_JSON = invalidJson;

    const event = {
      httpMethod: 'GET',
      queryStringParameters: { id: '1' },
    };

    const response = await handler(event);

    expect(response.statusCode).toBe(500);
    const body = JSON.parse(response.body);
    expect(body).toHaveProperty('error');

    // Body must NOT contain the invalid credential value
    expect(response.body).not.toContain(invalidJson);
    // Body must NOT contain any credential-like strings
    expect(response.body).not.toContain('invalid-json');
  });

  // Test 4: Preflight OPTIONS → HTTP 200 con cabeceras CORS
  it('returns HTTP 200 with CORS headers for OPTIONS preflight request', async () => {
    const event = {
      httpMethod: 'OPTIONS',
      queryStringParameters: {},
    };

    const response = await handler(event);

    expect(response.statusCode).toBe(200);
    expect(response.headers).toHaveProperty('Access-Control-Allow-Origin');
    expect(response.headers).toHaveProperty('Access-Control-Allow-Methods');
  });
});
