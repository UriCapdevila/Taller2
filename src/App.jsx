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
          <a className="app-brand" href="#story-start" aria-label="Ir al inicio">
            <span className="app-brand__course">Taller II</span>
            <span className="app-brand__title">Big Data <strong>y Salud</strong></span>
          </a>
          <TabBar activeTab={activeTab} onTabChange={setActiveTab} />
        </div>
      </header>

      <main className="app-main">
        <ErrorBoundary FallbackComponent={ErrorFallback} onReset={() => setActiveTab(initialDatasetId)}>
          <div
            id={`panel-${activeTab}`}
            className="tab-panel"
            role="tabpanel"
            aria-labelledby={`tab-${activeTab}`}
          >
            <TabContent data={data} loading={loading} error={error} />
          </div>
        </ErrorBoundary>
      </main>
    </div>
  );
}
