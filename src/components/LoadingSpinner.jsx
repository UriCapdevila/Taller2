/**
 * LoadingSpinner — visible loading indicator with accessible aria-label.
 * Shown while a dataset fetch is in progress (loading === true).
 * Requirements: 3.4
 */
const spinnerStyle = {
  display: 'inline-block',
  width: '2rem',
  height: '2rem',
  border: '3px solid #ccc',
  borderTopColor: '#333',
  borderRadius: '50%',
  animation: 'spin 0.8s linear infinite',
};

const containerStyle = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  padding: '2rem',
};

export default function LoadingSpinner() {
  return (
    <>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <div style={containerStyle} role="status">
        <span
          style={spinnerStyle}
          aria-label="Cargando datos del dataset…"
        />
      </div>
    </>
  );
}
