import { useEffect, useState } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import './App.css';
import TabBar from './components/TabBar';
import TabContent from './components/TabContent';
import ModelContent from './components/ModelContent';
import { availableDatasets } from './data/datasets';
import { useDataset } from './hooks/useDataset';
import { useModelArtifact } from './hooks/useModelArtifact';

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
  const [activeTab, setActiveTab] = useState('dataset');
  const datasetState = useDataset(initialDatasetId);
  const modelState = useModelArtifact(initialDatasetId, activeTab === 'model');

  useEffect(() => {
    const targetId = activeTab === 'model' ? 'model-cover' : 'story-start';
    document.getElementById(targetId)?.scrollIntoView?.({ block: 'start' });
  }, [activeTab, modelState.data]);

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-header__inner">
          <a className="app-brand" href={activeTab === 'model' ? '#model-cover' : '#story-start'} aria-label="Ir al inicio">
            <span className="app-brand__course">Taller II</span>
            <span className="app-brand__title">Big Data <strong>y Salud</strong></span>
          </a>
          <TabBar activeTab={activeTab} onTabChange={setActiveTab} />
        </div>
      </header>

      <main className="app-main">
        <ErrorBoundary FallbackComponent={ErrorFallback} onReset={() => setActiveTab('dataset')}>
          <div
            id={`panel-${activeTab}`}
            className="tab-panel"
            role="tabpanel"
            aria-labelledby={`tab-${activeTab}`}
          >
            {activeTab === 'dataset' ? (
              <TabContent {...datasetState} />
            ) : (
              <ModelContent {...modelState} />
            )}
          </div>
        </ErrorBoundary>
      </main>
    </div>
  );
}
