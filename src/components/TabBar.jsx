import { localDatasets } from '../data/datasets.js';

export default function TabBar({ activeTab, onTabChange }) {
  return (
    <nav role="tablist" aria-label="Dataset tabs" style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', backgroundColor: '#f8fafc', padding: '0 1.5rem', paddingTop: '1.5rem', gap: '1rem', overflowX: 'auto' }}>
      {localDatasets.map((dataset) => {
        const isActive = dataset.id === activeTab;
        return (
          <button
            key={dataset.id}
            role="tab"
            aria-selected={isActive}
            onClick={() => onTabChange(dataset.id)}
            style={{
              padding: '0.75rem 1.5rem',
              cursor: 'pointer',
              borderRadius: '8px 8px 0 0',
              fontSize: '0.95rem',
              fontWeight: isActive ? '600' : '500',
              transition: 'all 0.2s ease-in-out',
              outline: 'none',
              border: 'none',
              borderBottom: isActive ? '3px solid #3b82f6' : '3px solid transparent',
              backgroundColor: isActive ? '#ffffff' : 'transparent',
              color: isActive ? '#0f172a' : '#64748b',
              marginBottom: '-1px',
              whiteSpace: 'nowrap'
            }}
            onMouseOver={(e) => { if (!isActive) e.currentTarget.style.color = '#334155' }}
            onMouseOut={(e) => { if (!isActive) e.currentTarget.style.color = '#64748b' }}
          >
            {dataset.title}
          </button>
        );
      })}
    </nav>
  );
}
