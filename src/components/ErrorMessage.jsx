/**
 * ErrorMessage — renders a descriptive error message in the active tab's
 * content area without interrupting navigation between tabs.
 * Requirements: 3.6
 *
 * Props:
 *   message {string} — the error text to display
 */
const containerStyle = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  padding: '2rem',
};

const boxStyle = {
  maxWidth: '600px',
  width: '100%',
  padding: '1rem 1.5rem',
  borderRadius: '6px',
  backgroundColor: '#fff3f3',
  border: '1px solid #f5c6cb',
  color: '#721c24',
};

const headingStyle = {
  margin: '0 0 0.5rem 0',
  fontSize: '1rem',
  fontWeight: 'bold',
};

const messageStyle = {
  margin: 0,
  fontSize: '0.95rem',
};

export default function ErrorMessage({ message }) {
  return (
    <div style={containerStyle} role="alert" aria-live="assertive">
      <div style={boxStyle}>
        <p style={headingStyle}>Error al cargar los datos</p>
        <p style={messageStyle}>{message}</p>
      </div>
    </div>
  );
}
