/**
 * TabContent — renders the content area for the active tab.
 *
 * Priority order: loading > error > data > (empty/initial state)
 *
 * Props:
 *   data    {ArtifactJSON | null} — the fetched artifact, or null
 *   loading {boolean}            — true while a fetch is in progress
 *   error   {string | null}      — error message, or null
 *
 * Requirements: 3.4, 3.5, 3.6
 */
import LoadingSpinner from './LoadingSpinner';
import ErrorMessage from './ErrorMessage';
import ChartDisplay from './ChartDisplay';
import NotesDisplay from './NotesDisplay';

const containerStyle = {
  padding: '1rem',
};

export default function TabContent({ data, loading, error }) {
  if (loading) {
    return (
      <div style={containerStyle}>
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div style={containerStyle}>
        <ErrorMessage message={error} />
      </div>
    );
  }

  if (data) {
    return (
      <div style={containerStyle}>
        <ChartDisplay charts={data.charts} />
        <NotesDisplay notes={data.notes} />
      </div>
    );
  }

  // Initial state — no fetch has been triggered yet
  return null;
}
