export default function LoadingSpinner() {
  return (
    <div className="state-wrap">
      <div className="loading-state" role="status" aria-live="polite">
        <span className="spinner" aria-label="Cargando datos del dataset..." />
        <p>Cargando datos</p>
      </div>
    </div>
  );
}
