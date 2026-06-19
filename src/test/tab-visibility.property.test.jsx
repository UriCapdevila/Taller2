import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import * as fc from 'fast-check';
import { useState } from 'react';
import TabBar from '../components/TabBar.jsx';
import TabContent from '../components/TabContent.jsx';
import { availableDatasets } from '../data/datasets.js';

const datasetIds = availableDatasets.map((dataset) => dataset.id);

function TestApp({ activeTab }) {
  const [tab, setTab] = useState(activeTab);

  const artifact = {
    dataset_id: tab,
    title: `Dataset ${tab}`,
    generated_at: '2024-01-01T00:00:00Z',
    notes: `Notes for tab ${tab}`,
    charts: [],
  };

  return (
    <div>
      <TabBar activeTab={tab} onTabChange={setTab} />
      <div data-testid={`tabpanel-active-${tab}`} role="tabpanel" aria-labelledby={`tab-${tab}`}>
        <TabContent data={artifact} loading={false} error={null} />
      </div>
    </div>
  );
}

describe('Property 7: solo la tab activa muestra su contenido', () => {
  afterEach(() => {
    cleanup();
  });

  it('only the active tab has aria-selected=true and the others have aria-selected=false', () => {
    fc.assert(
      fc.property(fc.constantFrom(...datasetIds), (activeTab) => {
        const { unmount } = render(<TestApp activeTab={activeTab} />);

        for (const dataset of availableDatasets) {
          const tabButton = screen.getByRole('tab', { name: dataset.title });
          expect(tabButton).toHaveAttribute(
            'aria-selected',
            dataset.id === activeTab ? 'true' : 'false',
          );
        }

        expect(screen.getByTestId(`tabpanel-active-${activeTab}`)).toBeInTheDocument();

        for (const dataset of availableDatasets) {
          if (dataset.id !== activeTab) {
            expect(screen.queryByTestId(`tabpanel-active-${dataset.id}`)).not.toBeInTheDocument();
          }
        }

        unmount();
      }),
      { numRuns: 100 },
    );
  });
});
