import ReactMarkdown from 'react-markdown';

export default function NotesDisplay({ notes }) {
  if (!notes || notes.trim() === '') {
    return (
      <p style={{ fontStyle: 'italic', color: '#94a3b8', textAlign: 'center', padding: '2rem' }}>
        No hay notas analíticas disponibles para este dataset.
      </p>
    );
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem', color: '#0f172a', borderBottom: '2px solid #e2e8f0', paddingBottom: '0.5rem', marginTop: 0 }}>
        Notas Analíticas
      </h3>
      <div 
        style={{
          flex: 1,
          overflowY: 'auto',
          paddingRight: '1rem',
          color: '#334155',
          lineHeight: '1.7',
          fontSize: '1rem',
        }}
      >
        <ReactMarkdown>{notes}</ReactMarkdown>
      </div>
    </div>
  );
}
