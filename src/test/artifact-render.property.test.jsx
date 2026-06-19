import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import * as fc from 'fast-check';
import TabContent from '../components/TabContent.jsx';

const chartArb = fc.record({
  id: fc.uuid(),
  title: fc.string({ minLength: 1, maxLength: 80 }).filter((value) => value.trim().length > 0),
  type: fc.constantFrom('image/png', 'image/jpeg', 'image/svg+xml', 'image/gif'),
  data: fc.base64String({ minLength: 1 }),
});

const readableNotesArb = fc
  .stringOf(fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789,. '), {
    minLength: 1,
    maxLength: 500,
  })
  .filter((value) => value.trim().length > 0);

const artifactArb = fc.record({
  dataset_id: fc.integer({ min: 1, max: 4 }),
  title: fc.string({ minLength: 1, maxLength: 120 }),
  generated_at: fc.constant('2024-01-01T00:00:00Z'),
  notes: readableNotesArb,
  charts: fc.array(chartArb, { minLength: 0, maxLength: 10 }),
});

describe('Property 10: el renderizado de artefactos es completo y fiel', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders exactly N images with Base64 src and shows the notes text', () => {
    fc.assert(
      fc.property(artifactArb, (artifact) => {
        const { container, unmount } = render(
          <TabContent data={artifact} loading={false} error={null} />,
        );

        const imgs = container.querySelectorAll('img');
        expect(imgs).toHaveLength(artifact.charts.length);

        for (let index = 0; index < artifact.charts.length; index += 1) {
          const chart = artifact.charts[index];
          expect(imgs[index].getAttribute('src')).toBe(
            `data:${chart.type};base64,${chart.data}`,
          );
          expect(imgs[index].getAttribute('alt')).toBe(chart.title);
        }

        expect(container.textContent).toContain(artifact.notes.trim());

        unmount();
      }),
      { numRuns: 100 },
    );
  });
});
