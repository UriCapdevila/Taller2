// Feature: academic-data-viz, Property 8
// Property 8: El fetch se realiza exactamente una vez por tab por sesión
// Validates: Requirements 3.3, 3.7

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import * as fc from 'fast-check';
import { useState } from 'react';
import { useDataset } from '../hooks/useDataset.js';

/**
 * Wrapper hook that manages shared cache state and exposes a navigate function,
 * allowing the test to drive tab navigation without JSX or component rendering.
 */
function useTestHarness(initialId) {
  const [activeId, setActiveId] = useState(initialId);
  const [cache, setCache] = useState(new Map());
  const result = useDataset(activeId, cache, setCache);
  return { ...result, activeId, navigate: setActiveId };
}

describe('Property 8: El fetch se realiza exactamente una vez por tab por sesión', () => {
  beforeEach(() => {
    // Mock global fetch to return a valid artifact for any id
    global.fetch = vi.fn().mockImplementation((url) => {
      const id = parseInt(url.match(/artifact_(\d+)\.json/)[1], 10);
      return Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            dataset_id: id,
            title: 'Test',
            generated_at: '2024-01-01T00:00:00Z',
            notes: '',
            charts: [],
          }),
      });
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('fetches each tab id exactly once for any navigation sequence', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate a non-empty sequence of tab ids (1–4) with possible repetitions
        fc.array(fc.integer({ min: 1, max: 4 }), { minLength: 1, maxLength: 10 }),
        async (sequence) => {
          vi.clearAllMocks();

          const { result, unmount } = renderHook(() => useTestHarness(sequence[0]));

          // Wait for the initial fetch to complete
          await waitFor(() => {
            expect(global.fetch).toHaveBeenCalled();
          });

          // Navigate through the rest of the sequence
          for (let i = 1; i < sequence.length; i++) {
            await act(async () => {
              result.current.navigate(sequence[i]);
            });

            // Give React time to settle after each navigation
            await act(async () => {});
          }

          // Count fetch calls per id
          const callsPerId = new Map();
          for (const call of global.fetch.mock.calls) {
            const url = call[0];
            const id = parseInt(url.match(/artifact_(\d+)\.json/)[1], 10);
            callsPerId.set(id, (callsPerId.get(id) ?? 0) + 1);
          }

          // Every unique id in the sequence must have been fetched exactly once
          const uniqueIds = new Set(sequence);
          for (const id of uniqueIds) {
            expect(callsPerId.get(id)).toBe(1);
          }

          unmount();
        },
      ),
      { numRuns: 100 },
    );
  });
});
