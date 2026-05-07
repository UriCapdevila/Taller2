// Unit tests for UI components
// Validates: Requirements 3.1, 3.4, 4.4, 4.5

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import TabBar from '../components/TabBar.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import ChartDisplay from '../components/ChartDisplay.jsx';
import NotesDisplay from '../components/NotesDisplay.jsx';
import TabContent from '../components/TabContent.jsx';
import { DATASETS } from '../constants.js';

// ---------------------------------------------------------------------------
// TabBar
// ---------------------------------------------------------------------------

describe('TabBar', () => {
  it('renders exactly 4 tab buttons with the correct dataset names', () => {
    render(<TabBar activeTab={1} onTabChange={() => {}} />);

    const tabs = screen.getAllByRole('tab');
    expect(tabs).toHaveLength(4);

    DATASETS.forEach((dataset) => {
      expect(screen.getByText(dataset.name)).toBeInTheDocument();
    });
  });
});

// ---------------------------------------------------------------------------
// LoadingSpinner
// ---------------------------------------------------------------------------

describe('LoadingSpinner', () => {
  it('is visible in the DOM and has the expected aria-label', () => {
    render(<LoadingSpinner />);

    // The spinner container has role="status"
    const statusEl = screen.getByRole('status');
    expect(statusEl).toBeInTheDocument();

    // The inner span carries the aria-label
    const spinner = screen.getByLabelText('Cargando datos del dataset…');
    expect(spinner).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// ChartDisplay
// ---------------------------------------------------------------------------

describe('ChartDisplay', () => {
  it('renders the informative message when charts is an empty array', () => {
    render(<ChartDisplay charts={[]} />);

    expect(
      screen.getByText('No hay gráficos disponibles para este dataset'),
    ).toBeInTheDocument();
  });

  it('renders the informative message when charts is null', () => {
    render(<ChartDisplay charts={null} />);

    expect(
      screen.getByText('No hay gráficos disponibles para este dataset'),
    ).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// NotesDisplay
// ---------------------------------------------------------------------------

describe('NotesDisplay', () => {
  it('renders the informative message when notes is an empty string', () => {
    render(<NotesDisplay notes="" />);

    expect(
      screen.getByText('No hay notas disponibles para este dataset'),
    ).toBeInTheDocument();
  });

  it('renders the informative message when notes is null', () => {
    render(<NotesDisplay notes={null} />);

    expect(
      screen.getByText('No hay notas disponibles para este dataset'),
    ).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// TabContent
// ---------------------------------------------------------------------------

describe('TabContent', () => {
  it('renders LoadingSpinner when loading is true', () => {
    render(<TabContent data={null} loading={true} error={null} />);

    // LoadingSpinner renders a role="status" container
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('renders ErrorMessage when error is provided', () => {
    render(<TabContent data={null} loading={false} error="some error" />);

    // ErrorMessage renders a role="alert" container
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('renders ChartDisplay and NotesDisplay when data is provided', () => {
    const artifact = {
      dataset_id: 1,
      title: 'Test Dataset',
      generated_at: '2024-01-01T00:00:00Z',
      notes: 'Some analytical notes',
      charts: [
        {
          id: 'chart_1',
          title: 'Chart One',
          type: 'image/png',
          data: 'abc123',
        },
      ],
    };

    render(<TabContent data={artifact} loading={false} error={null} />);

    // ChartDisplay renders an <img> for each chart
    const img = screen.getByRole('img', { name: 'Chart One' });
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', 'data:image/png;base64,abc123');

    // NotesDisplay renders the notes text
    expect(screen.getByText('Some analytical notes')).toBeInTheDocument();
  });
});
