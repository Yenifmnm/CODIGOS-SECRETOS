import { useMemo, type CSSProperties, type ReactNode } from 'react';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import './floating.css';

interface FloatingLayerProps {
  children: ReactNode;
  /** Amplitud vertical en px de diseño (rango sugerido 4–12). */
  amplitude?: number;
  /** Duración del ciclo en segundos (rango sugerido 3–7). */
  duration?: number;
  delay?: number;
  /** Deriva horizontal opcional, para que no floten todos igual. */
  drift?: number;
  rotate?: number;
  className?: string;
  style?: CSSProperties;
}

/**
 * Flotación asincrónica. Cada instancia recibe su propia duración, delay,
 * amplitud y dirección para que los elementos se sientan a distinta
 * profundidad en vez de moverse en bloque.
 *
 * Anima sólo `translate`/`rotate` (compositor), nunca top/left.
 */
export function FloatingLayer({
  children,
  amplitude = 8,
  duration = 5,
  delay = 0,
  drift = 0,
  rotate = 0,
  className,
  style,
}: FloatingLayerProps) {
  const reduced = useReducedMotion();

  const vars = useMemo(
    () =>
      ({
        '--float-y': `${amplitude}px`,
        '--float-x': `${drift}px`,
        '--float-r': `${rotate}deg`,
        '--float-dur': `${duration}s`,
        '--float-delay': `${delay}s`,
      }) as CSSProperties,
    [amplitude, drift, rotate, duration, delay],
  );

  return (
    <div
      className={['floating', reduced ? 'floating--still' : '', className].filter(Boolean).join(' ')}
      style={{ ...vars, ...style }}
    >
      {children}
    </div>
  );
}
