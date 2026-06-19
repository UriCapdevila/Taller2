import ReactMarkdown from 'react-markdown';
import { repairMojibake } from '../utils/text.js';

export default function NotesDisplay({ notes, title = 'Notas anal\u00edticas', hideTitle = false }) {
  const cleanedNotes = repairMojibake(notes ?? '');

  if (cleanedNotes.trim() === '') {
    return (
      <p className="empty-state">
        {'No hay notas disponibles para este dataset.'}
      </p>
    );
  }

  return (
    <div>
      {!hideTitle && <h3 className="notes-title">{title}</h3>}
      <div className="notes-body">
        <ReactMarkdown>{cleanedNotes}</ReactMarkdown>
      </div>
    </div>
  );
}
