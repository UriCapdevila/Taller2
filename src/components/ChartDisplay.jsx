import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import StoryPage from './StoryPage.jsx';
import { repairMojibake } from '../utils/text.js';
import { getStoryTitleClass } from '../utils/storyLayout.js';

function buildChartSrc(chart, chartData) {
  if (chart?.type && chart?.data) {
    return `data:${chart.type};base64,${chart.data}`;
  }

  return chartData ?? '';
}

function cleanChartTitle(value) {
  return repairMojibake(value).replace(/^Gr\u00e1fico\s+\d+\s*:\s*/i, '');
}

function splitInsight(value) {
  const text = value.trim();
  const sentenceEnd = /\.\s+/g;
  let match = sentenceEnd.exec(text);

  while (match && match.index < 70) {
    match = sentenceEnd.exec(text);
  }

  if (!match) {
    return { lead: text, detail: '' };
  }

  return {
    lead: text.slice(0, match.index + 1),
    detail: text.slice(match.index + match[0].length),
  };
}

export default function ChartDisplay(props) {
  const { chart, chartData, codeSnippet, title, index = 0, total = 1 } = props;
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

  const chartTitle = cleanChartTitle(chart?.title ?? title ?? 'Gr\u00e1fico del dataset');
  const titleClass = getStoryTitleClass(chartTitle);
  const description = repairMojibake(chart?.description ?? '');
  const insight = splitInsight(description);
  const source = buildChartSrc(chart, chartData);
  const snippet = chart?.codeSnippet ?? codeSnippet;
  const hasImage = source && !imageFailed;

  return (
    <StoryPage
      id={`story-chart-${index + 1}`}
      className={`chart-story ${index % 2 === 1 ? 'chart-story--reverse' : ''} ${titleClass ? 'story-page--dense' : ''}`}
      label={`${chartTitle}. Visualizacion ${index + 1} de ${total}`}
    >
      <div className="chart-visual story-reveal story-reveal--visual">
        {hasImage ? (
          <img
            src={source}
            alt={chartTitle}
            loading={index > 0 ? 'lazy' : 'eager'}
            decoding="async"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <p className="empty-state">{'Gr\u00e1fico no disponible.'}</p>
        )}
      </div>

      <div className="story-copy story-reveal story-reveal--copy">
        <p className="story-chapter">
          {String(index + 2).padStart(2, '0')} · Visualización {index + 1} de {total}
        </p>
        <h2 className={`story-title ${titleClass}`.trim()}>{chartTitle}</h2>

        {insight.lead && <p className="story-lead">{insight.lead}</p>}

        {insight.detail && (
          <div className="story-detail">
            <ReactMarkdown>{insight.detail}</ReactMarkdown>
          </div>
        )}

        {snippet && (
          <details className="code-details">
            <summary>{'Ver código fuente'}</summary>
            <pre><code>{snippet}</code></pre>
          </details>
        )}
      </div>
    </StoryPage>
  );
}
