import { useMemo } from 'react';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import './sparkles.css';

interface SparklesProps {
  count?: number;
  /** Radio del área de emisión, en % del contenedor. */
  spread?: number;
  color?: string;
}

/**
 * Partículas luminosas para el reveal del premio ganador.
 * Se generan una sola vez (useMemo) y se animan por CSS: sin listeners ni rAF.
 */
export function Sparkles({ count = 18, spread = 46, color = '#fcc102' }: SparklesProps) {
  const reduced = useReducedMotion();

  const particles = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => {
        const angle = (i / count) * Math.PI * 2 + Math.random() * 0.6;
        const dist = spread * (0.5 + Math.random() * 0.5);
        return {
          id: i,
          x: Math.cos(angle) * dist,
          y: Math.sin(angle) * dist,
          size: 4 + Math.random() * 8,
          delay: Math.random() * 2.4,
          duration: 2.2 + Math.random() * 2,
        };
      }),
    [count, spread],
  );

  if (reduced) return null;

  return (
    <div className="sparkles" aria-hidden="true">
      {particles.map((p) => (
        <span
          key={p.id}
          className="sparkles__dot"
          style={{
            '--sx': `${p.x}%`,
            '--sy': `${p.y}%`,
            '--ssize': `${p.size}px`,
            '--sdelay': `${p.delay}s`,
            '--sdur': `${p.duration}s`,
            '--scolor': color,
          } as React.CSSProperties}
        />
      ))}
    </div>
  );
}
