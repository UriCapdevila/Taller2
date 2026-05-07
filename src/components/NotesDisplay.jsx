/**
 * NotesDisplay — renders the analytical notes from an artifact.
 *
 * The `notes` field in the artifact is plain text or Markdown.
 * Whitespace and line breaks are preserved using `white-space: pre-wrap`.
 *
 * Props:
 *   notes {string} — the notes text from the artifact JSON
 *
 * Requirements: 4.2, 4.5
 */
function NotesDisplay({ notes }) {
  if (!notes || notes.trim() === '') {
    return (
      <p style={{ fontStyle: 'italic', color: '#666' }}>
        No hay notas disponibles para este dataset
      </p>
    );
  }

  return (
    <div style={{ marginTop: '1.5rem' }}>
      <h3 style={{ fontSize: '1rem', fontWeight: 'bold', marginBottom: '0.5rem', color: '#333' }}>
        Notas analíticas
      </h3>
      <pre
        style={{
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          fontFamily: 'inherit',
          fontSize: '0.95rem',
          lineHeight: '1.6',
          color: '#333',
          backgroundColor: '#f9f9f9',
          border: '1px solid #e0e0e0',
          borderRadius: '4px',
          padding: '1rem',
          margin: 0,
        }}
      >
        {notes}
      </pre>
    </div>
  );
}

export default NotesDisplay;
