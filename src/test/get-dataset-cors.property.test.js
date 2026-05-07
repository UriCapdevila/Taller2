// Feature: academic-data-viz, Property 6
// Property 6: Las cabeceras CORS están presentes en todas las respuestas
// Validates: Requirements 2.5

import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fc from 'fast-check';

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

describe('Property 6: Las cabeceras CORS están presentes en todas las respuestas', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Set required environment variables
    process.env.GOOGLE_SERVICE_ACCOUNT_JSON = JSON.stringify({
      type: 'service_account',
      project_id: 'mock-project',
      private_key_id: 'mock-key-id',
      private_key: '-----BEGIN RSA PRIVATE KEY-----\nmock-key\n-----END RSA PRIVATE KEY-----\n',
      client_email: 'mock@mock-project.iam.gserviceaccount.com',
      client_id: '123456789',
      auth_uri: 'https://accounts.google.com/o/oauth2/auth',
      token_uri: 'https://oauth2.googleapis.com/token',
    });
    process.env.GOOGLE_DRIVE_FOLDER_ID = 'mock-folder-id';
  });

  it('includes CORS headers in all responses regardless of request type', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.oneof(
          // Valid id requests (1–4)
          fc.integer({ min: 1, max: 4 }).map((id) => ({
            httpMethod: 'GET',
            queryStringParameters: { id: String(id) },
          })),
          // Invalid id requests (strings not in ['1','2','3','4'])
          fc
            .string()
            .filter((s) => !['1', '2', '3', '4'].includes(s))
            .map((id) => ({ httpMethod: 'GET', queryStringParameters: { id } })),
          // OPTIONS preflight requests
          fc.constant({ httpMethod: 'OPTIONS', queryStringParameters: {} }),
        ),
        async (event) => {
          // For valid id requests, set up Drive mock to return a file and artifact
          const id = event.queryStringParameters?.id;
          const parsedId = parseInt(id, 10);
          const isValidId =
            id !== undefined &&
            id !== null &&
            !isNaN(parsedId) &&
            parsedId >= 1 &&
            parsedId <= 4 &&
            String(parsedId) === String(id).trim();

          if (isValidId) {
            const mockArtifact = {
              dataset_id: parsedId,
              title: 'Test Dataset',
              generated_at: '2024-01-01T00:00:00Z',
              notes: 'test notes',
              charts: [],
            };

            __mockFilesList.mockResolvedValueOnce({
              data: { files: [{ id: 'mock-file-id' }] },
            });

            __mockFilesGet.mockResolvedValueOnce({
              data: mockArtifact,
            });

            google.drive.mockReturnValue({
              files: {
                list: __mockFilesList,
                get: __mockFilesGet,
              },
            });
          }

          const response = await handler(event);

          // Assert CORS headers are present in every response
          expect(response.headers).toHaveProperty('Access-Control-Allow-Origin');
          expect(response.headers).toHaveProperty('Access-Control-Allow-Methods');
        },
      ),
      { numRuns: 100 },
    );
  });
});
