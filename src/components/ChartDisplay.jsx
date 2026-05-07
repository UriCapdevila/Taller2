/**
 * ChartDisplay — renders a list of Base64-encoded chart images.
 *
 * Props:
 *   charts: Chart[]  — array of chart objects from the artifact JSON
 *
 * Chart shape: { id: string, title: string, type: string, data: string }
 *   where `data` is a Base64 string without the data URI prefix.
 */
function ChartDisplay({ charts }) {
  if (!charts || charts.length === 0) {
    return (
      <p style={{ fontStyle: 'italic', color: '#666' }}>
        No hay gráficos disponibles para este dataset
      </p>
    );
  }

  return (
    <div>
      {charts.map((chart) => (
        <figure key={chart.id} style={{ margin: '1rem 0' }}>
          <img
            src={`data:${chart.type};base64,${chart.data}`}
            alt={chart.title}
            style={{ maxWidth: '100%' }}
          />
          <figcaption style={{ textAlign: 'center', fontSize: '0.9rem', color: '#444' }}>
            {chart.title}
          </figcaption>
        </figure>
      ))}
    </div>
  );
}

export default ChartDisplay;
