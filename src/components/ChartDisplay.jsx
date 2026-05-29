export default function ChartDisplay({ chartPath, codeSnippet }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', height: '100%' }}>
      <div style={{ flex: 1, backgroundColor: '#f1f5f9', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', border: '1px solid #e2e8f0', minHeight: '350px' }}>
        {chartPath ? (
          <img 
            src={chartPath} 
            alt="Dataset Chart" 
            style={{ maxWidth: '100%', maxHeight: '400px', objectFit: 'contain' }}
            onError={(e) => { e.target.src = 'https://via.placeholder.com/600x400?text=Gr%C3%A1fico+No+Encontrado' }}
          />
        ) : (
          <p style={{ color: '#64748b' }}>Gráfico no disponible</p>
        )}
      </div>
      
      {codeSnippet && (
        <div style={{ backgroundColor: '#1e293b', borderRadius: '8px', padding: '1rem', overflowX: 'auto', boxShadow: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)' }}>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 'bold' }}>
            Código Fuente
          </div>
          <pre style={{ margin: 0, color: '#f8fafc', fontSize: '0.9rem', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace' }}>
            <code>{codeSnippet}</code>
          </pre>
        </div>
      )}
    </div>
  );
}
