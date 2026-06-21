import { useReveal } from '../hooks/useReveal.js';

export default function StoryPage({ children, className = '', id, label }) {
  const { elementRef, isVisible } = useReveal();

  return (
    <section
      ref={elementRef}
      id={id}
      className={`story-page ${className}`.trim()}
      data-visible={isVisible}
      aria-label={label}
    >
      {children}
    </section>
  );
}
