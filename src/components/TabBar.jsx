import { availableDatasets } from '../data/datasets.js';
import { repairMojibake } from '../utils/text.js';

function getNextDatasetId(currentId, key) {
  const currentIndex = availableDatasets.findIndex((dataset) => dataset.id === currentId);
  const fallbackIndex = currentIndex === -1 ? 0 : currentIndex;

  if (key === 'Home') {
    return availableDatasets[0]?.id;
  }

  if (key === 'End') {
    return availableDatasets.at(-1)?.id;
  }

  if (key === 'ArrowRight') {
    return availableDatasets[(fallbackIndex + 1) % availableDatasets.length]?.id;
  }

  if (key === 'ArrowLeft') {
    return availableDatasets[
      (fallbackIndex - 1 + availableDatasets.length) % availableDatasets.length
    ]?.id;
  }

  return undefined;
}

export default function TabBar({ activeTab, onTabChange }) {
  const handleKeyDown = (event) => {
    const nextDatasetId = getNextDatasetId(activeTab, event.key);

    if (nextDatasetId === undefined) {
      return;
    }

    event.preventDefault();
    onTabChange(nextDatasetId);
  };

  return (
    <nav className="tab-bar" role="tablist" aria-label="Datasets" onKeyDown={handleKeyDown}>
      {availableDatasets.map((dataset) => {
        const isActive = dataset.id === activeTab;
        const title = repairMojibake(dataset.title);

        return (
          <button
            id={`tab-${dataset.id}`}
            className="tab-button"
            key={dataset.id}
            type="button"
            role="tab"
            aria-controls={`panel-${dataset.id}`}
            aria-selected={isActive}
            tabIndex={isActive ? 0 : -1}
            onClick={() => onTabChange(dataset.id)}
          >
            {title}
          </button>
        );
      })}
    </nav>
  );
}
