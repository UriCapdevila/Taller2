// Feature: academic-data-viz, Property 9
// Property 9: Cualquier error HTTP produce mensaje de error sin interrumpir la navegación
// Validates: Requirements 3.6

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import * as fc from 'fast-check';
import { useState } from 'react';
import { useDataset } from '../hooks/useDataset.js';

/**
 * Wrapper hook that manages shared cache state, mirroring the pattern used in App.jsx.
 */
function useTestHarness(id) {
  const [cache, setCache] = useState(new Map());
  return useDataset(id, cache, setCache);
}

describe('Property 9: Cualquier error HTTP produce mensaje de error sin interrumpir la navegación', () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // Feature: academic-data-viz, Property 9
  // Timeout is set to 60 s because 100 async renderHook runs are needed
  it(
    'exposes error !== null and data === null for any non-200 HTTP status code',
    async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate HTTP error status codes: any integer that is NOT 200.
          // We sample from realistic HTTP error codes to keep the test meaningful.
          fc.oneof(
            fc.integer({ min: 400, max: 599 }),                          // client and server errors
            fc.constantFrom(301, 302, 304),                              // redirects (not 200)
            fc.integer({ min: 100, max: 199 }),                          // informational
            fc.integer({ min: 201, max: 299 }).filter((s) => s !== 200), // 2xx except 200
            fc.integer({ min: 300, max: 399 }),                          // 3xx
          ),
          // Generate a valid tab id (1–4)
          fc.integer({ min: 1, max: 4 }),
          async (statusCode, tabId) => {
            vi.clearAllMocks();

            // Mock fetch to return a response with ok: false and the generated status code
            global.fetch = vi.fn().mockResolvedValue({
              ok: false,
              status: statusCode,
            });

            const { result, unmount } = renderHook(() => useTestHarness(tabId));

            // Wait until the hook has settled (loading becomes false)
            await waitFor(() => {
              expect(result.current.loading).toBe(false);
            });

            // Property assertion: error must be set and data must remain null
            expect(result.current.error).not.toBeNull();
            expect(result.current.data).toBeNull();

            unmount();
          },
        ),
        { numRuns: 100 },
      );
    },
    60_000, // 60 s timeout for 100 async iterations
  );
});
