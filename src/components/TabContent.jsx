import ChartDisplay from './ChartDisplay';
import ErrorMessage from './ErrorMessage';
import LoadingSpinner from './LoadingSpinner';
import NotesDisplay from './NotesDisplay';
import StoryPage from './StoryPage';
import StoryProgress from './StoryProgress';
import { repairMojibake } from '../utils/text.js';
import { getStoryTitleClass } from '../utils/storyLayout.js';

function removeDatasetName(value) {
  return repairMojibake(value ?? '')
    .replace(/del dataset NTR\s+A+rogya\s*Seva/gi, 'del programa de salud')
    .replace(/NTR\s+A+rogya\s*Seva/gi, 'el programa de salud');
}

function extractRecordCount(intro, charts) {
  const chartDescriptions = charts.map((chart) => chart.description ?? '').join(' ');
  const content = repairMojibake(`${chartDescriptions} ${intro ?? ''}`);
  const exactMatch = content.match(/total de\s+(\d{1,3}(?:[.,]\d{3})+)\s+registros/i);
  const approximateMatch = content.match(/(?:casi\s+)?(\d{1,3}(?:[.,]\d{3})+)\s+registros/i);

  return exactMatch?.[1] ?? approximateMatch?.[1] ?? 'Miles de';
}

function extractHighlights(conclusion) {
  const content = repairMojibake(conclusion ?? '');
  const age = content.match(/promedio\s+(\d+(?:[.,]\d+)?)\s+años mayores/i)?.[1];
  const privateAccess = content.match(/BC accede[^()]*\((\d+(?:[.,]\d+)?)%\s+vs\./i)?.[1];
  const nephrology = content.match(/Nefrología[^\n]*?BC:\s*(\d+(?:[.,]\d+)?)%[^\n]*?OC:\s*(\d+(?:[.,]\d+)?)%/i);
  const gender = content.match(/BC:\s*(0[.,]\d+)[^\n]*?OC:\s*(0[.,]\d+)/i);
  const representation = content.match(/representan\s+el\s+(\d+(?:[.,]\d+)?)%\s+del dataset/i)?.[1];

  return [
    nephrology && { value: `${nephrology[1]}%`, label: `mortalidad BC en Nefrología vs. ${nephrology[2]}% en OC` },
    gender && { value: gender[1], label: `niñas por cada niño en BC; ${gender[2]} en OC` },
    representation && { value: `${representation}%`, label: 'del dataset corresponde a BC y OC' },
    !nephrology && age && { value: age, label: 'años de diferencia promedio entre OC y BC' },
    !representation && privateAccess && { value: `${privateAccess}%`, label: 'acceso BC al sector privado' },
  ].filter(Boolean);
}

function StoryCover({ intro, chartCount, recordCount }) {
  return (
    <StoryPage id="story-start" className="story-cover" label="Introduccion al analisis">
      <div className="story-cover__visual story-reveal story-reveal--visual">
        <p className="story-kicker">Una lectura en datos</p>
        <p className="cover-number">{recordCount}</p>
        <p className="cover-number__label">historias clínicas observadas</p>
        <div className="cover-index" aria-label={`${chartCount} visualizaciones`}>
          <span>{String(chartCount).padStart(2, '0')}</span>
          <small>visualizaciones</small>
        </div>
      </div>

      <div className="story-cover__copy story-reveal story-reveal--copy">
        <p className="story-chapter">Prólogo</p>
        <h1>La salud pública también cuenta una historia social.</h1>
        <NotesDisplay notes={removeDatasetName(intro)} hideTitle />
        <a className="scroll-cue" href="#story-chart-1">
          Comenzar lectura <span aria-hidden="true">↓</span>
        </a>
      </div>
    </StoryPage>
  );
}

function StoryConclusion({ section, highlights, index, total, slideNumber }) {
  const title = repairMojibake(section.title ?? 'Conclusiones');
  const titleClass = getStoryTitleClass(title);
  const showHighlights = index === 0 && highlights.length > 0;

  return (
    <StoryPage
      id={`story-conclusion-${index + 1}`}
      className={`story-conclusion ${titleClass ? 'story-page--dense' : ''}`}
      label={`${title}. Conclusión ${index + 1} de ${total}`}
    >
      <div className="conclusion-visual story-reveal story-reveal--visual" aria-label="Cifras destacadas">
        {showHighlights ? highlights.map((highlight) => (
          <div key={highlight.label}>
            <strong>{highlight.value}</strong>
            <span>{highlight.label}</span>
          </div>
        )) : (
          <div className="conclusion-index">
            <strong>{String(index + 1).padStart(2, '0')}</strong>
            <span>capítulo de cierre</span>
          </div>
        )}
      </div>
      <div className="story-copy story-reveal story-reveal--copy">
        <p className="story-chapter">
          {String(slideNumber).padStart(2, '0')} · Conclusión {index + 1} de {total}
        </p>
        <h2 className={`story-title ${titleClass}`.trim()}>{title}</h2>
        <NotesDisplay notes={removeDatasetName(section.body)} hideTitle />
        {index === total - 1 && (
          <a className="scroll-cue" href="#story-start">
            Volver al inicio <span aria-hidden="true">↑</span>
          </a>
        )}
      </div>
    </StoryPage>
  );
}

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
  const conclusionSections = data.conclusion_sections?.length
    ? data.conclusion_sections
    : data.conclusion
      ? [{ id: 'conclusion_01', title: 'Conclusiones', body: data.conclusion }]
      : [];
  const totalPages = chartCount + Number(Boolean(intro)) + conclusionSections.length;
  const recordCount = extractRecordCount(intro, charts);
  const highlights = extractHighlights(data.conclusion);

  return (
    <div className="story-flow">
      {totalPages > 0 && <StoryProgress total={totalPages} />}
      {intro && (
        <StoryCover intro={intro} chartCount={chartCount} recordCount={recordCount} />
      )}

      {chartCount > 0 ? charts.map((chart, index) => (
        <ChartDisplay
          key={chart.id}
          chart={{ ...chart, description: removeDatasetName(chart.description) }}
          index={index}
          total={chartCount}
        />
      )) : <ChartDisplay charts={[]} />}

      {conclusionSections.map((section, index) => (
        <StoryConclusion
          key={section.id ?? `${section.title}-${index}`}
          section={section}
          highlights={highlights}
          index={index}
          total={conclusionSections.length}
          slideNumber={chartCount + 2 + index}
        />
      ))}
    </div>
  );
}
