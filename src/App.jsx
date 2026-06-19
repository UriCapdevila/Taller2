import { useState } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import './App.css';
import TabBar from './components/TabBar';
import TabContent from './components/TabContent';
import { availableDatasets } from './data/datasets';
import { useDataset } from './hooks/useDataset';

function ErrorFallback({ error, resetErrorBoundary }) {
  return (
    <div className="state-wrap">
      <div className="error-box" role="alert">
        <h2>{'\u00a1Ups! Algo sali\u00f3 mal.'}</h2>
        <pre>{error.message}</pre>
        <button className="retry-button" onClick={resetErrorBoundary}>
          Intentar de nuevo
        </button>
      </div>
    </div>
  );
}

const initialDatasetId = availableDatasets[0]?.id ?? 2;

export default function App() {
  const [activeTab, setActiveTab] = useState(initialDatasetId);
  const { data, loading, error } = useDataset(activeTab);

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-header__inner">
          <div>
            <p className="app-eyebrow">Taller II</p>
            <h1 className="app-title">
              Big Data <span>y Salud</span>
            </h1>
            <p className="app-subtitle">
              {'Visualizaci\u00f3n est\u00e1tica e interactiva de resultados de investigaci\u00f3n, con foco en claridad, lectura r\u00e1pida y trazabilidad del an\u00e1lisis.'}
            </p>
          </div>
        </div>
      </header>

      <main className="app-main">
        <div className="dashboard-shell">
          <TabBar activeTab={activeTab} onTabChange={setActiveTab} />

          <ErrorBoundary FallbackComponent={ErrorFallback} onReset={() => setActiveTab(initialDatasetId)}>
            <section
              id={`panel-${activeTab}`}
              className="tab-panel"
              role="tabpanel"
              aria-labelledby={`tab-${activeTab}`}
            >
              <TabContent data={data} loading={loading} error={error} />
            </section>
          </ErrorBoundary>
        </div>
      </main>
    </div>
  );
}
