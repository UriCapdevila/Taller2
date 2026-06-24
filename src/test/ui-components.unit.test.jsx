import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import ChartDisplay from '../components/ChartDisplay.jsx';
import ModelContent from '../components/ModelContent.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import NotesDisplay from '../components/NotesDisplay.jsx';
import TabBar from '../components/TabBar.jsx';
import TabContent from '../components/TabContent.jsx';
import { availableViews } from '../data/datasets.js';

describe('TabBar', () => {
  it('renders the configured dataset tabs', () => {
    render(<TabBar activeTab={availableViews[0].id} onTabChange={() => {}} />);

    const tabs = screen.getAllByRole('tab');
    expect(tabs).toHaveLength(availableViews.length);

    availableViews.forEach((view) => {
      expect(screen.getByRole('tab', { name: view.title })).toBeInTheDocument();
    });
  });
});

describe('ModelContent', () => {
  it('renders the static predictive story and its metrics', () => {
    const artifact = {
      models: {
        general: {
          cohort: { records: 479688, test_records: 71954 },
          metrics: {
            recall: 0.4516,
            precision: 0.0928,
            confusion_matrix: { tn: 63727, fp: 6708, fn: 833, tp: 686 },
          },
        },
        caste_bc_oc: {
          cohort: { records: 360287 },
          caste_coefficient: { odds_ratio: 1.005 },
          group_metrics: {
            BC: {
              metrics: {
                recall: 0.4429,
                confusion_matrix: { fn: 429, tp: 341 },
              },
            },
            OC: {
              metrics: {
                recall: 0.4047,
                confusion_matrix: { fn: 203, tp: 138 },
              },
            },
          },
        },
      },
      charts: [],
      sections: [
        {
          id: 'model-cover',
          kind: 'cover',
          kicker: 'Modelo predictivo',
          title: 'De describir a predecir',
          lead: 'Dos modelos locales.',
          body: 'Resultados estáticos.',
        },
      ],
    };

    render(<ModelContent data={artifact} loading={false} error={null} />);

    expect(screen.getByRole('heading', {
      name: '\u00bfPodemos anticipar qu\u00e9 casos necesitan una mirada m\u00e1s atenta?',
    })).toBeInTheDocument();
    expect(screen.getByRole('heading', {
      name: 'El modelo detect\u00f3 45 de cada 100 fallecimientos en casos que nunca hab\u00eda visto.',
    })).toBeInTheDocument();
    expect(screen.getAllByText('686')).not.toHaveLength(0);
    expect(screen.getByText('44,3% detectado')).toBeInTheDocument();
    expect(screen.getByText('40,5% detectado')).toBeInTheDocument();
    expect(screen.getAllByRole('region')).toHaveLength(6);
    expect(screen.getByRole('navigation', { name: 'Navegación de la historia' })).toBeInTheDocument();
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

  it('uses a compact title for long chart headings', () => {
    render(
      <ChartDisplay
        chart={{
          id: 'long-title',
          title: 'Tasa de mortalidad por especialidad y tipo de hospital entre BC y OC',
          type: 'image/png',
          data: 'abc123',
        }}
      />,
    );

    expect(screen.getByRole('heading')).toHaveClass('story-title--compact');
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
    expect(screen.getByRole('navigation', { name: 'Navegación de la historia' })).toBeInTheDocument();
    expect(screen.getByText('/')).toBeInTheDocument();
  });

  it('renders long conclusions as separate story pages', () => {
    const artifact = {
      dataset_id: 2,
      notes: 'Contexto',
      charts: [],
      conclusion: 'Conclusión completa',
      conclusion_sections: [
        { id: 'one', title: 'Síntesis', body: 'Primer cierre' },
        { id: 'two', title: 'Limitaciones', body: 'Segundo cierre' },
      ],
    };

    render(<TabContent data={artifact} loading={false} error={null} />);

    expect(screen.getByRole('heading', { name: 'Síntesis' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Limitaciones' })).toBeInTheDocument();
    expect(screen.getByText('Primer cierre')).toBeInTheDocument();
    expect(screen.getByText('Segundo cierre')).toBeInTheDocument();
  });
});
