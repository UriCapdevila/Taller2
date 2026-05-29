import ChartDisplay from './ChartDisplay';
import NotesDisplay from './NotesDisplay';

export default function TabContent({ data, loading, error }) {
  if (loading) {
    return <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>Cargando datos...</div>;
  }
  
  if (error) {
    // We throw the error so that the ErrorBoundary in App.jsx catches it
    throw new Error(error);
  }
  
  if (!data) return null;

  return (
    <div style={{ 
      display: 'grid', 
      gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', 
      gap: '2.5rem',
      padding: '2rem',
      alignItems: 'start'
    }}>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <ChartDisplay chartPath={data.chartPath} codeSnippet={data.codeSnippet} />
      </div>
      <div style={{ height: '100%', maxHeight: '600px' }}>
        <NotesDisplay notes={data.markdownText} />
      </div>
    </div>
  );
}
