import { useEffect, useState } from 'react';

export function useStoryProgress(total) {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const pages = [...document.querySelectorAll('.story-page')];

    if (pages.length === 0 || typeof IntersectionObserver === 'undefined') {
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const visiblePage = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        if (visiblePage) {
          setCurrent(pages.indexOf(visiblePage.target));
        }
      },
      { threshold: [0.35, 0.55, 0.75] },
    );

    pages.forEach((page) => observer.observe(page));
    return () => observer.disconnect();
  }, [total]);

  const goTo = (index) => {
    const targetIndex = Math.min(Math.max(index, 0), total - 1);
    const pages = document.querySelectorAll('.story-page');
    pages[targetIndex]?.scrollIntoView?.({ behavior: 'smooth', block: 'start' });
  };

  return {
    current,
    goNext: () => goTo(current + 1),
    goPrevious: () => goTo(current - 1),
  };
}
