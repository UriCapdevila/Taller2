import { availableViews } from '../data/datasets.js';
import { repairMojibake } from '../utils/text.js';

function getNextViewId(currentId, key) {
  const currentIndex = availableViews.findIndex((view) => view.id === currentId);
  const fallbackIndex = currentIndex === -1 ? 0 : currentIndex;

  if (key === 'Home') {
    return availableViews[0]?.id;
  }

  if (key === 'End') {
    return availableViews.at(-1)?.id;
  }

  if (key === 'ArrowRight') {
    return availableViews[(fallbackIndex + 1) % availableViews.length]?.id;
  }

  if (key === 'ArrowLeft') {
    return availableViews[
      (fallbackIndex - 1 + availableViews.length) % availableViews.length
    ]?.id;
  }

  return undefined;
}

export default function TabBar({ activeTab, onTabChange }) {
  const handleKeyDown = (event) => {
    const nextViewId = getNextViewId(activeTab, event.key);

    if (nextViewId === undefined) {
      return;
    }

    event.preventDefault();
    onTabChange(nextViewId);
  };

  return (
    <nav className="tab-bar" role="tablist" aria-label="Contenido" onKeyDown={handleKeyDown}>
      {availableViews.map((view) => {
        const isActive = view.id === activeTab;
        const title = repairMojibake(view.title);

        return (
          <button
            id={`tab-${view.id}`}
            className="tab-button"
            key={view.id}
            type="button"
            role="tab"
            aria-controls={`panel-${view.id}`}
            aria-selected={isActive}
            tabIndex={isActive ? 0 : -1}
            onClick={() => onTabChange(view.id)}
          >
            {title}
          </button>
        );
      })}
    </nav>
  );
}
