// Feature: academic-data-viz, Property 5
// Property 5: Cualquier id inválido produce HTTP 400 con body JSON
// Validates: Requirements 2.6

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { handler } from '../../netlify/functions/get-dataset.js';

/**
 * Arbitrary that generates invalid id values:
 * - Arbitrary strings (not "1", "2", "3", "4")
 * - Floats as strings (e.g., "1.5", "2.7")
 * - Negative integers as strings (e.g., "-1", "-5")
 * - Integers > 4 as strings (e.g., "5", "100")
 * - Empty string
 */
const invalidIdArbitrary = fc.oneof(
  // Arbitrary strings that are not valid ids "1"-"4"
  fc.string().filter((s) => !['1', '2', '3', '4'].includes(s.trim())),
  // Floats as strings
  fc
    .float({ min: -1000, max: 1000, noNaN: true, noDefaultInfinity: true })
    .filter((n) => !Number.isInteger(n))
    .map((n) => String(n)),
  // Negative integers as strings
  fc.integer({ min: -1000, max: -1 }).map((n) => String(n)),
  // Integers > 4 as strings
  fc.integer({ min: 5, max: 1000 }).map((n) => String(n)),
);

describe('Property 5: Cualquier id inválido produce HTTP 400 con body JSON', () => {
  it('returns HTTP 400 with JSON error body for any invalid id string', async () => {
    await fc.assert(
      fc.asyncProperty(invalidIdArbitrary, async (invalidId) => {
        const event = {
          httpMethod: 'GET',
          queryStringParameters: { id: invalidId },
        };

        const response = await handler(event);

        expect(response.statusCode).toBe(400);

        const body = JSON.parse(response.body);
        expect(body).toHaveProperty('error');
      }),
      { numRuns: 100 },
    );
  });

  it('returns HTTP 400 with JSON error body when id is absent (empty queryStringParameters)', async () => {
    const event = {
      httpMethod: 'GET',
      queryStringParameters: {},
    };

    const response = await handler(event);

    expect(response.statusCode).toBe(400);
    const body = JSON.parse(response.body);
    expect(body).toHaveProperty('error');
  });

  it('returns HTTP 400 with JSON error body when queryStringParameters is null', async () => {
    const event = {
      httpMethod: 'GET',
      queryStringParameters: null,
    };

    const response = await handler(event);

    expect(response.statusCode).toBe(400);
    const body = JSON.parse(response.body);
    expect(body).toHaveProperty('error');
  });

  it('returns HTTP 400 with JSON error body when id is undefined', async () => {
    const event = {
      httpMethod: 'GET',
      queryStringParameters: { id: undefined },
    };

    const response = await handler(event);

    expect(response.statusCode).toBe(400);
    const body = JSON.parse(response.body);
    expect(body).toHaveProperty('error');
  });
});
