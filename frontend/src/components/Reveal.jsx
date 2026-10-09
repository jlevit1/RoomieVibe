import { useReveal } from '../hooks/useReveal';

// Wraps section content so it gently fades/rises into place the first time
// it scrolls into view, instead of just appearing.
export default function Reveal({ children, className = '', delay = 0 }) {
  const [ref, visible] = useReveal();

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
      } ${className}`}
      style={{ transitionDelay: visible ? `${delay}ms` : '0ms' }}
    >
      {children}
    </div>
  );
}
