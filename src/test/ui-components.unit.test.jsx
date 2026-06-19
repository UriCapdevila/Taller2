import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import ChartDisplay from '../components/ChartDisplay.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import NotesDisplay from '../components/NotesDisplay.jsx';
import TabBar from '../components/TabBar.jsx';
import TabContent from '../components/TabContent.jsx';
import { availableDatasets } from '../data/datasets.js';

describe('TabBar', () => {
  it('renders the configured dataset tabs', () => {
    render(<TabBar activeTab={availableDatasets[0].id} onTabChange={() => {}} />);

    const tabs = screen.getAllByRole('tab');
    expect(tabs).toHaveLength(availableDatasets.length);

    availableDatasets.forEach((dataset) => {
      expect(screen.getByRole('tab', { name: dataset.title })).toBeInTheDocument();
    });
  });
});

describe('LoadingSpinner', () => {
  it('is visible in the DOM and has the expected aria-label', () => {
    render(<LoadingSpinner />);

    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByLabelText('Cargando datos del dataset...')).toBeInTheDocument();
  });
});

describe('ChartDisplay', () => {
  it('renders the informative message when charts is an empty array', () => {
    render(<ChartDisplay charts={[]} />);

    expect(
      screen.getByText('No hay gr\u00e1ficos disponibles para este dataset.'),
    ).toBeInTheDocument();
  });

  it('renders the informative message when charts is null', () => {
    render(<ChartDisplay charts={null} />);

    expect(
      screen.getByText('No hay gr\u00e1ficos disponibles para este dataset.'),
    ).toBeInTheDocument();
  });
});

describe('NotesDisplay', () => {
  it('renders the informative message when notes is an empty string', () => {
    render(<NotesDisplay notes="" />);

    expect(screen.getByText('No hay notas disponibles para este dataset.')).toBeInTheDocument();
  });

  it('renders the informative message when notes is null', () => {
    render(<NotesDisplay notes={null} />);

    expect(screen.getByText('No hay notas disponibles para este dataset.')).toBeInTheDocument();
  });
});

describe('TabContent', () => {
  it('renders LoadingSpinner when loading is true', () => {
    render(<TabContent data={null} loading={true} error={null} />);

    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('renders ErrorMessage when error is provided', () => {
    render(<TabContent data={null} loading={false} error="some error" />);

    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('renders ChartDisplay and NotesDisplay when data is provided', () => {
    const artifact = {
      dataset_id: 2,
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

    const img = screen.getByRole('img', { name: 'Chart One' });
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', 'data:image/png;base64,abc123');
    expect(screen.getByText('Some analytical notes')).toBeInTheDocument();
  });
});
