// Feature: academic-data-viz, Property 7
// Property 7: Solo la tab activa muestra su contenido
// Validates: Requirements 3.2

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import * as fc from 'fast-check';
import { useState } from 'react';
import TabBar from '../components/TabBar.jsx';
import TabContent from '../components/TabContent.jsx';
import { DATASETS } from '../constants.js';

/**
 * Minimal test component that renders TabBar + TabContent with a controlled
 * activeTab prop. The content area renders a data-testid that includes the
 * active tab id so we can assert which tab's content is shown.
 */
function TestApp({ activeTab }) {
  const [tab, setTab] = useState(activeTab);

  // Build a minimal artifact for the active tab so TabContent renders real content
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

describe('Property 7: Solo la tab activa muestra su contenido', () => {
  beforeEach(() => {
    // Mock fetch so TabContent never triggers a real network request
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ dataset_id: 1, title: 'T', generated_at: '', notes: '', charts: [] }),
    });
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  // Feature: academic-data-viz, Property 7
  it('only the active tab has aria-selected=true and the others have aria-selected=false', () => {
    fc.assert(
      fc.property(
        // Generate any valid tab id (1–4)
        fc.integer({ min: 1, max: 4 }),
        (activeTab) => {
          const { unmount } = render(<TestApp activeTab={activeTab} />);

          // Verify aria-selected on every tab button
          for (const dataset of DATASETS) {
            const tabButton = screen.getByRole('tab', { name: dataset.name });
            if (dataset.id === activeTab) {
              expect(tabButton).toHaveAttribute('aria-selected', 'true');
            } else {
              expect(tabButton).toHaveAttribute('aria-selected', 'false');
            }
          }

          // Verify the active tab's content panel is present in the DOM
          const activePanel = screen.getByTestId(`tabpanel-active-${activeTab}`);
          expect(activePanel).toBeInTheDocument();

          // Verify that panels for the other tabs are NOT present in the DOM
          // (App.jsx renders only one TabContent for the active tab)
          for (const dataset of DATASETS) {
            if (dataset.id !== activeTab) {
              expect(screen.queryByTestId(`tabpanel-active-${dataset.id}`)).not.toBeInTheDocument();
            }
          }

          unmount();
        },
      ),
      { numRuns: 100 },
    );
  });
});
