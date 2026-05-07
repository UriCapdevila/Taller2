// Feature: academic-data-viz, Property 4
// Property 4: La Netlify Function devuelve el artefacto correcto para cualquier id válido
// Validates: Requirements 2.3, 2.4

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

describe('Property 4: La Netlify Function devuelve el artefacto correcto para cualquier id válido', () => {
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

  it('returns HTTP 200 with correct artifact for any valid id (1–4)', async () => {
    await fc.assert(
      fc.asyncProperty(fc.integer({ min: 1, max: 4 }), async (id) => {
        // Build the mock artifact for this id
        const mockArtifact = {
          dataset_id: id,
          title: 'Test',
          generated_at: '2024-01-01T00:00:00Z',
          notes: 'test notes',
          charts: [],
        };

        // Set up mock: files.list returns one file
        __mockFilesList.mockResolvedValueOnce({
          data: { files: [{ id: 'mock-file-id' }] },
        });

        // Set up mock: files.get returns the artifact
        __mockFilesGet.mockResolvedValueOnce({
          data: mockArtifact,
        });

        // Re-configure the drive mock to use the updated mocks
        google.drive.mockReturnValue({
          files: {
            list: __mockFilesList,
            get: __mockFilesGet,
          },
        });

        const event = {
          httpMethod: 'GET',
          queryStringParameters: { id: String(id) },
        };

        const response = await handler(event);

        // Assert HTTP 200
        expect(response.statusCode).toBe(200);

        // Assert Content-Type header
        expect(response.headers['Content-Type']).toBe('application/json');

        // Assert body contains correct dataset_id
        const body = JSON.parse(response.body);
        expect(body.dataset_id).toBe(id);
      }),
      { numRuns: 100 },
    );
  });
});
