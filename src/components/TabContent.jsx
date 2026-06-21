import ChartDisplay from './ChartDisplay';
import ErrorMessage from './ErrorMessage';
import LoadingSpinner from './LoadingSpinner';
import NotesDisplay from './NotesDisplay';
import StoryPage from './StoryPage';
import { repairMojibake } from '../utils/text.js';

function removeDatasetName(value) {
  return repairMojibake(value ?? '')
    .replace(/del dataset NTR\s+A+rogya\s*Seva/gi, 'del programa de salud')
    .replace(/NTR\s+A+rogya\s*Seva/gi, 'el programa de salud');
}

function StoryCover({ intro, chartCount }) {
  return (
    <StoryPage id="story-start" className="story-cover" label="Introduccion al analisis">
      <div className="story-cover__visual story-reveal story-reveal--visual">
        <p className="story-kicker">Una lectura en datos</p>
        <p className="cover-number">479.688</p>
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

function StoryConclusion({ conclusion, slideNumber }) {
  return (
    <StoryPage id="story-conclusion" className="story-conclusion" label="Conclusiones">
      <div className="conclusion-visual story-reveal story-reveal--visual" aria-label="Cifras destacadas">
        <div><strong>5</strong><span>años de diferencia promedio entre OC y BC</span></div>
        <div><strong>4,08%</strong><span>mortalidad BC en Nefrología</span></div>
        <div><strong>75,8%</strong><span>acceso BC al sector privado</span></div>
      </div>
      <div className="story-copy story-reveal story-reveal--copy">
        <p className="story-chapter">{String(slideNumber).padStart(2, '0')} · Epílogo</p>
        <NotesDisplay notes={removeDatasetName(conclusion)} hideTitle />
        <a className="scroll-cue" href="#story-start">
          Volver al inicio <span aria-hidden="true">↑</span>
        </a>
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

  return (
    <div className="story-flow">
      {intro && <StoryCover intro={intro} chartCount={chartCount} />}

      {chartCount > 0 ? charts.map((chart, index) => (
        <ChartDisplay
          key={chart.id}
          chart={{ ...chart, description: removeDatasetName(chart.description) }}
          index={index}
          total={chartCount}
        />
      )) : <ChartDisplay charts={[]} />}

      {data.conclusion && (
        <StoryConclusion conclusion={data.conclusion} slideNumber={chartCount + 2} />
      )}
    </div>
  );
}
