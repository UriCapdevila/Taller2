import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { repairMojibake } from '../utils/text.js';

function buildChartSrc(chart, chartData) {
  if (chart?.type && chart?.data) {
    return `data:${chart.type};base64,${chart.data}`;
  }

  return chartData ?? '';
}

export default function ChartDisplay(props) {
  const { chart, chartData, codeSnippet, title } = props;
  const [imageFailed, setImageFailed] = useState(false);

  if (Object.prototype.hasOwnProperty.call(props, 'charts')) {
    const charts = props.charts ?? [];

    if (charts.length === 0) {
      return (
        <div className="chart-card">
          <div className="chart-frame">
            <p className="empty-state">
              {'No hay gr\u00e1ficos disponibles para este dataset.'}
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="charts-grid">
        {charts.map((item) => (
          <ChartDisplay key={item.id} chart={item} />
        ))}
      </div>
    );
  }

  const chartTitle = repairMojibake(chart?.title ?? title ?? 'Gr\u00e1fico del dataset');
  const description = repairMojibake(chart?.description ?? '');
  const source = buildChartSrc(chart, chartData);
  const snippet = chart?.codeSnippet ?? codeSnippet;
  const hasImage = source && !imageFailed;

  return (
    <article className="chart-card">
      <div className="chart-card__header">
        <h3 className="chart-card__title">{chartTitle}</h3>
      </div>

      <div className="chart-frame">
        {hasImage ? (
          <img src={source} alt={chartTitle} onError={() => setImageFailed(true)} />
        ) : (
          <p className="empty-state">{'Gr\u00e1fico no disponible.'}</p>
        )}
      </div>

      {description.trim() && (
        <div className="chart-description">
          <ReactMarkdown>{description}</ReactMarkdown>
        </div>
      )}

      {snippet && (
        <details className="code-details">
          <summary>{'C\u00f3digo fuente'}</summary>
          <pre>
            <code>{snippet}</code>
          </pre>
        </details>
      )}
    </article>
  );
}
