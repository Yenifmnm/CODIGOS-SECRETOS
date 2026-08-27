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

  /* DOS ELEMENTOS POR PARTÍCULA, y no es decoración del marcado.

     El desplazamiento va en `translate(var(--sx), var(--sy))`, y los
     porcentajes de `translate` se resuelven contra el PROPIO elemento, no
     contra el contenedor. Con la partícula midiendo entre 4 y 12 px, un
     `--sx: 46%` movía la partícula 2 px: las dieciocho quedaban latiendo
     encima del centro del premio y, sumadas con su `box-shadow`, se veían como
     un punto naranja fijo en el medio del efecto. Así se veía en el teléfono.

     `.sparkles__orbit` mide lo mismo que el contenedor (`inset: 0`), así que
     ahí el porcentaje SÍ es «% del contenedor», que es lo que documenta la
     prop `spread`. La partícula va adentro, chiquita y centrada. */
  return (
    <div className="sparkles" aria-hidden="true">
      {particles.map((p) => (
        <span
          key={p.id}
          className="sparkles__orbit"
          style={{
            '--sx': `${p.x}%`,
            '--sy': `${p.y}%`,
            '--sdelay': `${p.delay}s`,
            '--sdur': `${p.duration}s`,
          } as React.CSSProperties}
        >
          <i
            className="sparkles__dot"
            style={{ '--ssize': `${p.size}px`, '--scolor': color } as React.CSSProperties}
          />
        </span>
      ))}
    </div>
  );
}
