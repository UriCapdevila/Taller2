import { DATASETS } from '../constants.js';

const activeStyle = {
  backgroundColor: '#1a73e8',
  color: '#ffffff',
  border: '2px solid #1a73e8',
  fontWeight: 'bold',
};

const inactiveStyle = {
  backgroundColor: '#f1f3f4',
  color: '#3c4043',
  border: '2px solid #dadce0',
  fontWeight: 'normal',
};

const baseStyle = {
  padding: '10px 20px',
  cursor: 'pointer',
  borderRadius: '4px 4px 0 0',
  fontSize: '14px',
  marginRight: '4px',
  transition: 'background-color 0.2s, color 0.2s',
  outline: 'none',
};

export default function TabBar({ activeTab, onTabChange }) {
  return (
    <nav role="tablist" aria-label="Dataset tabs" style={{ display: 'flex', borderBottom: '2px solid #dadce0', paddingBottom: '0' }}>
      {DATASETS.map((dataset) => {
        const isActive = dataset.id === activeTab;
        return (
          <button
            key={dataset.id}
            role="tab"
            aria-selected={isActive}
            aria-controls={`tabpanel-${dataset.id}`}
            id={`tab-${dataset.id}`}
            onClick={() => onTabChange(dataset.id)}
            style={{
              ...baseStyle,
              ...(isActive ? activeStyle : inactiveStyle),
              marginBottom: isActive ? '-2px' : '0',
            }}
          >
            {dataset.name}
          </button>
        );
      })}
    </nav>
  );
}
