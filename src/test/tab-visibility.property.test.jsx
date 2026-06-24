import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import * as fc from 'fast-check';
import { useState } from 'react';
import TabBar from '../components/TabBar.jsx';
import TabContent from '../components/TabContent.jsx';
import { availableViews } from '../data/datasets.js';

const viewIds = availableViews.map((view) => view.id);

function TestApp({ activeView }) {
  const [tab, setTab] = useState(activeView);

  const artifact = {
    dataset_id: 2,
    title: `Vista ${tab}`,
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
      fc.property(fc.constantFrom(...viewIds), (activeTab) => {
        const { unmount } = render(<TestApp activeView={activeTab} />);

        for (const view of availableViews) {
          const tabButton = screen.getByRole('tab', { name: view.title });
          expect(tabButton).toHaveAttribute(
            'aria-selected',
            view.id === activeTab ? 'true' : 'false',
          );
        }

        expect(screen.getByTestId(`tabpanel-active-${activeTab}`)).toBeInTheDocument();

        for (const view of availableViews) {
          if (view.id !== activeTab) {
            expect(screen.queryByTestId(`tabpanel-active-${view.id}`)).not.toBeInTheDocument();
          }
        }

        unmount();
      }),
      { numRuns: 100 },
    );
  });
});
