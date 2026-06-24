import StoryPage from './StoryPage.jsx';
import StoryProgress from './StoryProgress.jsx';
import ErrorMessage from './ErrorMessage.jsx';
import LoadingSpinner from './LoadingSpinner.jsx';
import { repairMojibake } from '../utils/text.js';
import { getStoryTitleClass } from '../utils/storyLayout.js';

const STORY_TOTAL = 6;

function formatNumber(value) {
  return new Intl.NumberFormat('es-AR').format(value ?? 0);
}

function formatPercent(value, digits = 1) {
  return new Intl.NumberFormat('es-AR', {
    style: 'percent',
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value ?? 0);
}

function getMatrix(model) {
  return model?.metrics?.confusion_matrix ?? { tn: 0, fp: 0, fn: 0, tp: 0 };
}

function WhyVisual() {
  const reasons = [
    ['01', 'Se puede explicar', 'Permite mostrar qué información influye en el resultado.'],
    ['02', 'Funciona a gran escala', 'Puede aprender de casi 480.000 historias sin perder claridad.'],
    ['03', 'Entrega un nivel de riesgo', 'No responde solo sí o no: ordena los casos para revisarlos.'],
  ];

  return (
    <div className="model-reasons" aria-label="Razones para elegir la regresión logística">
      {reasons.map(([number, title, description]) => (
        <div key={number}>
          <span>{number}</span>
          <strong>{title}</strong>
          <p>{description}</p>
        </div>
      ))}
    </div>
  );
}

function GoalVisual() {
  return (
    <div className="model-goal" aria-label="Recorrido esperado del modelo">
      <div>
        <span>Paso 1</span>
        <strong>Leer el caso</strong>
        <p>Edad, sexo, especialidad, hospital, territorio y monto autorizado.</p>
      </div>
      <div>
        <span>Paso 2</span>
        <strong>Estimar el riesgo</strong>
        <p>Buscar patrones aprendidos en casos anteriores.</p>
      </div>
      <div>
        <span>Paso 3</span>
        <strong>Priorizar una revisión</strong>
        <p>Señalar casos que podrían necesitar mayor atención.</p>
      </div>
    </div>
  );
}

function GeneralResultsVisual({ model }) {
  const matrix = getMatrix(model);
  const recall = model?.metrics?.recall ?? 0;
  const precision = model?.metrics?.precision ?? 0;
  const evaluated = matrix.tn + matrix.fp + matrix.fn + matrix.tp;

  return (
    <div className="model-results" aria-label="Resultados del modelo general">
      <p className="model-results__context">
        Prueba final: <strong>{formatNumber(evaluated)}</strong> historias que el modelo no había visto
      </p>
      <div className="model-results__headline">
        <strong>{Math.round(recall * 100)}</strong>
        <span>de cada 100 fallecimientos fueron señalados</span>
      </div>
      <div
        className="model-results__track"
        role="img"
        aria-label={`${formatPercent(recall)} de los fallecimientos detectados`}
      >
        <span style={{ width: `${recall * 100}%` }} />
      </div>
      <div className="model-results__counts">
        <div><strong>{formatNumber(matrix.tp)}</strong><span>detectados</span></div>
        <div><strong>{formatNumber(matrix.fn)}</strong><span>no detectados</span></div>
        <div><strong>{formatPercent(precision)}</strong><span>de las alertas coincidieron con un fallecimiento</span></div>
      </div>
    </div>
  );
}

function GroupRow({ name, group }) {
  const recall = group?.metrics?.recall ?? 0;
  const matrix = group?.metrics?.confusion_matrix ?? { tp: 0, fn: 0 };

  return (
    <div className="model-group-row">
      <div className="model-group-row__heading">
        <strong>{name}</strong>
        <span>{formatPercent(recall)} detectado</span>
      </div>
      <progress max="1" value={recall} aria-label={`Detección en ${name}: ${formatPercent(recall)}`} />
      <p>{formatNumber(matrix.tp)} detectados · {formatNumber(matrix.fn)} no detectados</p>
    </div>
  );
}

function GroupResultsVisual({ model }) {
  const groups = model?.group_metrics ?? {};
  const bcRecall = groups.BC?.metrics?.recall ?? 0;
  const ocRecall = groups.OC?.metrics?.recall ?? 0;
  const gap = Math.abs(bcRecall - ocRecall);

  return (
    <div className="model-groups" aria-label="Comparación de resultados entre BC y OC">
      <GroupRow name="BC" group={groups.BC} />
      <GroupRow name="OC" group={groups.OC} />
      <p className="model-groups__difference">
        Diferencia de detección: <strong>{formatPercent(gap)}</strong>
      </p>
    </div>
  );
}

function ConclusionVisual({ model }) {
  const recall = model?.metrics?.recall ?? 0;
  const precision = model?.metrics?.precision ?? 0;

  return (
    <div className="model-verdict" aria-label="Balance final del modelo">
      <div>
        <span>Sí aporta</span>
        <strong>Una primera señal</strong>
        <p>Detectó {formatPercent(recall)} de los fallecimientos en datos nuevos.</p>
      </div>
      <div>
        <span>Todavía no alcanza</span>
        <strong>Para decidir por sí solo</strong>
        <p>Solo {formatPercent(precision)} de sus alertas coincidieron con un fallecimiento.</p>
      </div>
    </div>
  );
}

function ModelCover({ general, caste }) {
  const recall = general?.metrics?.recall ?? 0;
  const precision = general?.metrics?.precision ?? 0;
  const matrix = getMatrix(general);
  const evaluated = matrix.tn + matrix.fp + matrix.fn + matrix.tp;

  return (
    <StoryPage id="model-cover" className="model-cover" label="Introducción al modelo predictivo">
      <div className="model-cover__visual story-reveal story-reveal--visual">
        <p className="story-kicker">Resultado principal</p>
        <p className="model-cover__number">
          {Math.round(recall * 100)} <span>de 100</span>
        </p>
        <p className="model-cover__label">fallecimientos señalados en la prueba final</p>
        <div className="model-cover__stats">
          <div><strong>{formatNumber(evaluated)}</strong><span>casos usados para comprobarlo</span></div>
          <div><strong>{formatPercent(precision)}</strong><span>alertas que coincidieron con un fallecimiento</span></div>
          <div><strong>{formatNumber(caste?.cohort?.records)}</strong><span>casos en la comparación BC/OC</span></div>
        </div>
      </div>
      <div className="story-cover__copy story-reveal story-reveal--copy">
        <p className="story-chapter">Modelo predictivo</p>
        <h1>¿Podemos anticipar qué casos necesitan una mirada más atenta?</h1>
        <p className="model-cover__lead">
          Entrenamos un modelo para reconocer señales asociadas con mayor riesgo de mortalidad usando información disponible al autorizar la atención.
        </p>
        <p className="model-cover__body">
          El resultado es prometedor como punto de partida, pero todavía insuficiente para tomar decisiones médicas.
        </p>
        <a className="scroll-cue" href="#model-why">
          Entender la elección <span aria-hidden="true">↓</span>
        </a>
      </div>
    </StoryPage>
  );
}

function ModelStoryPage({ id, index, kicker, title, lead, visual, children, reverse = false }) {
  const titleClass = getStoryTitleClass(title);

  return (
    <StoryPage
      id={id}
      className={`model-story chart-story ${reverse ? 'chart-story--reverse' : ''} ${titleClass ? 'story-page--dense' : ''}`}
      label={`${title} Página ${index} de ${STORY_TOTAL}`}
    >
      <div className="chart-visual model-visual story-reveal story-reveal--visual">
        {visual}
      </div>
      <div className="story-copy story-reveal story-reveal--copy">
        <p className="story-chapter">{kicker}</p>
        <h2 className={`story-title ${titleClass}`.trim()}>{title}</h2>
        <p className="story-lead">{lead}</p>
        <div className="story-detail model-story__detail">{children}</div>
      </div>
    </StoryPage>
  );
}

export default function ModelContent({ data, loading, error }) {
  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={repairMojibake(error)} />;
  if (!data) {
    return <div className="state-wrap"><p className="empty-state">No hay resultados predictivos disponibles.</p></div>;
  }

  const general = data.models?.general;
  const caste = data.models?.caste_bc_oc;
  const casteOddsRatio = caste?.caste_coefficient?.odds_ratio ?? 1;

  return (
    <div className="story-flow model-flow">
      <StoryProgress total={STORY_TOTAL} />
      <ModelCover general={general} caste={caste} />

      <ModelStoryPage
        id="model-why"
        index={2}
        kicker="01 / Por qué este modelo"
        title="Elegimos una regresión logística porque podemos explicar cómo llega a sus resultados."
        lead="Es un método conocido, adecuado para respuestas de tipo sí o no y capaz de trabajar con una gran cantidad de registros."
        visual={<WhyVisual />}
      >
        <p>No queríamos una caja negra. Este modelo permite revisar qué variables aumentan o reducen la estimación de riesgo.</p>
        <p>Además, ofrece una base simple y reproducible para comparar futuras mejoras.</p>
      </ModelStoryPage>

      <ModelStoryPage
        id="model-goal"
        index={3}
        kicker="02 / Qué queremos lograr"
        title="Buscamos una alerta temprana, no un diagnóstico automático."
        lead="La meta es ordenar los casos por nivel de riesgo para ayudar a decidir cuáles merecen una revisión más atenta."
        visual={<GoalVisual />}
        reverse
      >
        <p>El modelo usa solo datos disponibles antes del desenlace. No conoce el alta, el reclamo ni la fecha de mortalidad.</p>
        <p>Su función esperada sería apoyar una revisión humana, nunca reemplazarla ni restringir una cobertura.</p>
      </ModelStoryPage>

      <ModelStoryPage
        id="model-results"
        index={4}
        kicker="03 / Resultados"
        title="El modelo detectó 45 de cada 100 fallecimientos en casos que nunca había visto."
        lead={`Se comprobó con ${formatNumber(general?.cohort?.test_records)} historias separadas del entrenamiento.`}
        visual={<GeneralResultsVisual model={general} />}
      >
        <p>Señaló correctamente {formatNumber(getMatrix(general).tp)} fallecimientos y no alcanzó a detectar {formatNumber(getMatrix(general).fn)}.</p>
        <p>Para encontrar esos casos generó muchas alertas adicionales: por eso sirve para priorizar una revisión, pero no para decidir por sí solo.</p>
      </ModelStoryPage>

      <ModelStoryPage
        id="model-groups"
        index={5}
        kicker="04 / Comparación BC y OC"
        title="El desempeño fue parecido en ambas castas, aunque detectó algo menos en OC."
        lead="Aplicamos la misma regla a BC y OC para observar si el modelo cometía errores muy diferentes entre los dos grupos."
        visual={<GroupResultsVisual model={caste} />}
        reverse
      >
        <p>Detectó {formatPercent(caste?.group_metrics?.BC?.metrics?.recall)} de los fallecimientos en BC y {formatPercent(caste?.group_metrics?.OC?.metrics?.recall)} en OC.</p>
        <p>Una vez consideradas las demás variables, pertenecer a BC u OC casi no modificó la estimación por sí sola (relación ajustada: {casteOddsRatio.toFixed(3)}).</p>
      </ModelStoryPage>

      <ModelStoryPage
        id="model-conclusion"
        index={6}
        kicker="05 / Conclusión"
        title="Es un punto de partida útil, pero todavía no una herramienta para tomar decisiones."
        lead="El modelo encontró una señal real de riesgo, aunque dejó sin detectar más de la mitad de los fallecimientos y produjo muchas alertas incorrectas."
        visual={<ConclusionVisual model={general} />}
      >
        <p>Su principal valor académico es demostrar que la información previa a la atención contiene patrones que pueden estudiarse de forma predictiva.</p>
        <p>Para mejorar harían falta datos clínicos sobre gravedad y enfermedades previas, además de probar el modelo en otra población.</p>
      </ModelStoryPage>
    </div>
  );
}
