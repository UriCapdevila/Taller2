import { useStoryProgress } from '../hooks/useStoryProgress.js';

export default function StoryProgress({ total }) {
  const { current, goNext, goPrevious } = useStoryProgress(total);
  const displayedCurrent = Math.min(current + 1, total);
  const progress = total > 1 ? current / (total - 1) : 1;

  return (
    <nav className="story-progress" aria-label="Navegación de la historia">
      <button
        type="button"
        className="story-progress__button"
        onClick={goPrevious}
        disabled={current === 0}
        aria-label="Ir a la página anterior"
        title="Página anterior"
      >
        <span aria-hidden="true">↑</span>
      </button>

      <div className="story-progress__track" aria-hidden="true">
        <span style={{ '--story-progress': progress }} />
      </div>

      <output className="story-progress__count" aria-live="polite">
        <strong>{String(displayedCurrent).padStart(2, '0')}</strong>
        <span>/</span>
        <span>{String(total).padStart(2, '0')}</span>
      </output>

      <button
        type="button"
        className="story-progress__button"
        onClick={goNext}
        disabled={current === total - 1}
        aria-label="Ir a la página siguiente"
        title="Página siguiente"
      >
        <span aria-hidden="true">↓</span>
      </button>
    </nav>
  );
}
