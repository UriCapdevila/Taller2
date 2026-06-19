import ChartDisplay from './ChartDisplay';
import ErrorMessage from './ErrorMessage';
import LoadingSpinner from './LoadingSpinner';
import NotesDisplay from './NotesDisplay';
import { repairMojibake } from '../utils/text.js';

export default function TabContent({ data, loading, error }) {
  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <ErrorMessage message={repairMojibake(error)} />;
  }

  if (!data) {
    return (
      <div className="state-wrap">
        <p className="empty-state">No hay datos para mostrar.</p>
      </div>
    );
  }

  const charts = data.charts ?? [];
  const chartCount = charts.length;
  const intro = data.intro ?? data.notes;

  return (
    <div className="content-stack">
      {intro && (
        <section className="narrative-panel" aria-label="Contexto del analisis">
          <NotesDisplay notes={intro} title="Contexto" />
        </section>
      )}

      <section className="charts-section" aria-labelledby="charts-heading">
        <div className="section-heading">
          <h2 id="charts-heading">{'Visualizaciones'}</h2>
          <p>
            {chartCount === 1
              ? '1 gr\u00e1fico disponible'
              : `${chartCount} gr\u00e1ficos disponibles`}
          </p>
        </div>

        {chartCount > 0 ? (
          <div className="charts-grid">
            {charts.map((chart) => (
              <ChartDisplay key={chart.id} chart={chart} />
            ))}
          </div>
        ) : (
          <ChartDisplay charts={[]} />
        )}
      </section>

      {data.conclusion && (
        <section className="narrative-panel" aria-label="Conclusiones">
          <NotesDisplay notes={data.conclusion} hideTitle />
        </section>
      )}
    </div>
  );
}
