import { useState } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import TabBar from './components/TabBar';
import TabContent from './components/TabContent';
import { useDataset } from './hooks/useDataset';

function ErrorFallback({ error, resetErrorBoundary }) {
  return (
    <div role="alert" style={{ padding: '2rem', backgroundColor: '#fee2e2', color: '#b91c1c', borderRadius: '8px', margin: '1rem' }}>
      <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>¡Ups! Algo salió mal.</h2>
      <pre style={{ marginTop: '0.5rem', whiteSpace: 'pre-wrap', fontSize: '0.9rem' }}>{error.message}</pre>
      <button 
        onClick={resetErrorBoundary} 
        style={{ marginTop: '1rem', padding: '0.5rem 1rem', backgroundColor: '#b91c1c', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: '500' }}>
        Intentar de nuevo
      </button>
    </div>
  );
}

export default function App() {
  const [activeTab, setActiveTab] = useState(1);
  const { data, loading, error } = useDataset(activeTab);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', display: 'flex', flexDirection: 'column', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <header style={{ backgroundColor: '#ffffff', padding: '1.5rem', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}>
        <h1 style={{ margin: 0, fontSize: '1.8rem', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.025em' }}>
          Taller II <span style={{ color: '#3b82f6' }}>Big Data y la Salud</span>
        </h1>
        <p style={{ margin: 0, marginTop: '0.5rem', color: '#64748b', fontSize: '1rem' }}>
          Visualización estática e interactiva de resultados de investigación.
        </p>
      </header>

      <main style={{ flex: 1, padding: '2rem', maxWidth: '1200px', margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
        <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)', overflow: 'hidden' }}>
          <TabBar activeTab={activeTab} onTabChange={setActiveTab} />
          
          <ErrorBoundary FallbackComponent={ErrorFallback} onReset={() => setActiveTab(1)}>
            <div style={{ minHeight: '500px' }}>
              <TabContent data={data} loading={loading} error={error} />
            </div>
          </ErrorBoundary>
        </div>
      </main>
    </div>
  );
}
