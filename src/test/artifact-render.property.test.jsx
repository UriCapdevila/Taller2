// Feature: academic-data-viz, Property 10
// Property 10: El renderizado de artefactos es completo y fiel
// Validates: Requirements 3.5, 4.1, 4.2

import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import * as fc from 'fast-check';
import TabContent from '../components/TabContent.jsx';

/**
 * Arbitrary for a single chart object.
 * `data` is a non-empty base64 string (simulates Base64 — the component just
 * concatenates it into the src attribute, so it doesn't need to be a real image).
 */
const chartArb = fc.record({
  id: fc.uuid(),
  title: fc.string({ minLength: 1, maxLength: 80 }),
  type: fc.constantFrom('image/png', 'image/jpeg', 'image/svg+xml', 'image/gif'),
  data: fc.base64String({ minLength: 1 }),
});

/**
 * Arbitrary for a non-empty, non-whitespace-only notes string.
 * NotesDisplay treats strings where trim() === '' as empty and shows a fallback,
 * so we generate strings that have at least one non-whitespace character.
 */
const nonEmptyNotesArb = fc
  .string({ minLength: 1, maxLength: 500 })
  .filter((s) => s.trim().length > 0);

/**
 * Arbitrary for a full artifact with N charts (0–10) and non-empty notes.
 */
const artifactArb = fc.record({
  dataset_id: fc.integer({ min: 1, max: 4 }),
  title: fc.string({ minLength: 1, maxLength: 120 }),
  generated_at: fc.constant('2024-01-01T00:00:00Z'),
  notes: nonEmptyNotesArb,
  charts: fc.array(chartArb, { minLength: 0, maxLength: 10 }),
});

describe('Property 10: El renderizado de artefactos es completo y fiel', () => {
  afterEach(() => {
    cleanup();
  });

  // Feature: academic-data-viz, Property 10
  it('renders exactly N <img> elements with Base64 src and shows the notes text', () => {
    fc.assert(
      fc.property(artifactArb, (artifact) => {
        const { container, unmount } = render(
          <TabContent data={artifact} loading={false} error={null} />,
        );

        const N = artifact.charts.length;

        // --- Verify exactly N <img> elements are rendered ---
        // Use container-scoped query to avoid picking up elements from prior iterations
        const imgs = container.querySelectorAll('img');
        expect(imgs).toHaveLength(N);

        // --- Verify each <img> has a src starting with "data:image/" ---
        for (const img of imgs) {
          expect(img.getAttribute('src')).toMatch(/^data:image\//);
        }

        // --- Verify each src encodes the correct chart data ---
        for (let i = 0; i < N; i++) {
          const chart = artifact.charts[i];
          const expectedSrc = `data:${chart.type};base64,${chart.data}`;
          expect(imgs[i].getAttribute('src')).toBe(expectedSrc);
        }

        // --- Verify the notes text appears in the DOM ---
        // NotesDisplay renders the notes inside a <pre> element.
        // Use within(container) to scope the query to this render only.
        const pre = container.querySelector('pre');
        expect(pre).not.toBeNull();
        expect(pre.textContent).toBe(artifact.notes);

        unmount();
      }),
      { numRuns: 100 },
    );
  });
});
